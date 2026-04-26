<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentCategory;
use App\Models\DocumentSignature;
use App\Models\HrDocument;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class HrDocumentController extends Controller
{
    private function authorise(): void
    {
        abort_unless(Auth::user()?->hasPermission('documents.manage'), 403);
    }

    public function index(Request $request): Response
    {
        $this->authorise();

        $query = HrDocument::with(['employee:id,name,employee_id', 'category:id,name,code', 'uploadedBy:id,name'])
            ->orderByDesc('created_at');

        if ($search = $request->input('search')) {
            $query->whereHas('employee', fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('employee_id', 'like', "%{$search}%")
            )->orWhere('title', 'like', "%{$search}%");
        }

        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        $documents = $query->paginate(30)->withQueryString();
        $categories = DocumentCategory::active()->ordered()->get(['id', 'name', 'code']);
        $employees = User::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id']);

        return Inertia::render('Admin/DocumentVaultPage', [
            'documents' => $documents,
            'categories' => $categories,
            'employees' => $employees,
            'filters' => $request->only(['search', 'category_id', 'status', 'user_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'category_id' => ['required', 'exists:document_categories,id'],
            'title' => ['required', 'string', 'max:300'],
            'file' => ['required', 'file', 'max:20480', 'mimes:pdf,doc,docx,png,jpg,jpeg'],
            'requires_signature' => ['boolean'],
            'effective_date' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:effective_date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'signees' => ['nullable', 'array'],
            'signees.*' => ['exists:users,id'],
        ]);

        $file = $request->file('file');
        $path = $file->store("employee/{$validated['user_id']}", 'hr');
        $category = DocumentCategory::find($validated['category_id']);

        $requiresSig = $validated['requires_signature']
            ?? $category->requires_signature;

        $document = HrDocument::create([
            'user_id' => $validated['user_id'],
            'category_id' => $validated['category_id'],
            'title' => $validated['title'],
            'file_path' => $path,
            'disk' => 'hr',
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'version' => 1,
            'status' => 'active',
            'requires_signature' => $requiresSig,
            'uploaded_by_id' => Auth::id(),
            'effective_date' => $validated['effective_date'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Create pending signature records for each signee
        if ($requiresSig && ! empty($validated['signees'])) {
            $signees = array_unique($validated['signees']);
            foreach ($signees as $signeeId) {
                DocumentSignature::firstOrCreate(
                    ['document_id' => $document->id, 'signee_id' => $signeeId],
                    ['status' => 'pending']
                );
            }
        }

        return back()->with('success', 'Document uploaded successfully.');
    }

    public function update(Request $request, HrDocument $hrDocument): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:300'],
            'category_id' => ['required', 'exists:document_categories,id'],
            'effective_date' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', 'in:draft,active,superseded,expired'],
        ]);

        $hrDocument->update($validated);

        return back()->with('success', 'Document updated.');
    }

    public function destroy(HrDocument $hrDocument): RedirectResponse
    {
        $this->authorise();

        // Remove the stored file
        Storage::disk($hrDocument->disk)->delete($hrDocument->file_path);

        $hrDocument->delete();

        return back()->with('success', 'Document deleted.');
    }
}
