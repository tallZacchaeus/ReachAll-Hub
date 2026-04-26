<?php

namespace Tests\Feature;

use App\Models\DocumentCategory;
use App\Models\DocumentSignature;
use App\Models\HrDocument;
use App\Models\User;
use Database\Seeders\DocumentCategorySeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HrDocumentVaultTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('hr');
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(DocumentCategorySeeder::class);
    }

    private function hrUser(): User
    {
        return User::factory()->create(['role' => 'hr']);
    }

    private function staffUser(): User
    {
        return User::factory()->create(['role' => 'staff']);
    }

    private function category(): DocumentCategory
    {
        return DocumentCategory::first();
    }

    private function fakeFile(): UploadedFile
    {
        return UploadedFile::fake()->create('test.pdf', 100, 'application/pdf');
    }

    private function makeDocument(User $employee, array $overrides = []): HrDocument
    {
        $category = $this->category();

        return HrDocument::create(array_merge([
            'user_id' => $employee->id,
            'category_id' => $category->id,
            'title' => 'Test Document',
            'file_path' => 'employee/'.$employee->id.'/test.pdf',
            'disk' => 'hr',
            'file_size' => 1024,
            'mime_type' => 'application/pdf',
            'version' => 1,
            'status' => 'active',
            'requires_signature' => false,
        ], $overrides));
    }

    // ── Authentication ───────────────────────────────────────────────────────

    public function test_guest_is_redirected_from_vault(): void
    {
        $this->get('/admin/hr/documents')->assertRedirect(route('login'));
    }

    public function test_guest_is_redirected_from_my_documents(): void
    {
        $this->get('/my-documents')->assertRedirect(route('login'));
    }

    // ── Authorisation ────────────────────────────────────────────────────────

    public function test_staff_cannot_access_document_vault(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/admin/hr/documents')
            ->assertForbidden();
    }

    public function test_hr_can_access_document_vault(): void
    {
        $this->actingAs($this->hrUser())
            ->get('/admin/hr/documents')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/DocumentVaultPage')
                ->has('documents')
                ->has('categories')
                ->has('employees')
            );
    }

    public function test_any_authenticated_user_can_access_my_documents(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/my-documents')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('MyDocumentsPage')
                ->has('documents')
            );
    }

    // ── Upload ───────────────────────────────────────────────────────────────

    public function test_hr_can_upload_a_document(): void
    {
        $hr = $this->hrUser();
        $employee = $this->staffUser();
        $category = $this->category();

        $this->actingAs($hr)
            ->post('/admin/hr/documents', [
                'user_id' => $employee->id,
                'category_id' => $category->id,
                'title' => 'Employment Contract 2026',
                'file' => $this->fakeFile(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('hr_documents', [
            'user_id' => $employee->id,
            'category_id' => $category->id,
            'title' => 'Employment Contract 2026',
            'status' => 'active',
            'disk' => 'hr',
        ]);
    }

    public function test_staff_cannot_upload_documents(): void
    {
        $employee = $this->staffUser();
        $category = $this->category();

        $this->actingAs($this->staffUser())
            ->post('/admin/hr/documents', [
                'user_id' => $employee->id,
                'category_id' => $category->id,
                'title' => 'Sneaky Upload',
                'file' => $this->fakeFile(),
            ])
            ->assertForbidden();
    }

    public function test_upload_validates_required_fields(): void
    {
        $this->actingAs($this->hrUser())
            ->post('/admin/hr/documents', [])
            ->assertSessionHasErrors(['user_id', 'category_id', 'title', 'file']);
    }

    public function test_upload_with_signature_creates_pending_records(): void
    {
        $hr = $this->hrUser();
        $employee = $this->staffUser();
        $category = $this->category();

        $this->actingAs($hr)
            ->post('/admin/hr/documents', [
                'user_id' => $employee->id,
                'category_id' => $category->id,
                'title' => 'NDA',
                'file' => $this->fakeFile(),
                'requires_signature' => true,
                'signees' => [$employee->id],
            ])
            ->assertRedirect();

        $doc = HrDocument::where('title', 'NDA')->first();
        $this->assertNotNull($doc);
        $this->assertTrue($doc->requires_signature);

        $this->assertDatabaseHas('document_signatures', [
            'document_id' => $doc->id,
            'signee_id' => $employee->id,
            'status' => 'pending',
        ]);
    }

    // ── Download ─────────────────────────────────────────────────────────────

    public function test_hr_can_download_any_document(): void
    {
        $employee = $this->staffUser();
        $doc = $this->makeDocument($employee);
        Storage::disk('hr')->put($doc->file_path, 'dummy content');

        $this->actingAs($this->hrUser())
            ->get("/admin/hr/documents/{$doc->id}/download")
            ->assertOk();
    }

    public function test_employee_cannot_download_another_employees_document(): void
    {
        $employee1 = $this->staffUser();
        $employee2 = $this->staffUser();
        $doc = $this->makeDocument($employee1);
        Storage::disk('hr')->put($doc->file_path, 'dummy content');

        $this->actingAs($employee2)
            ->get("/admin/hr/documents/{$doc->id}/download")
            ->assertForbidden();
    }

    // ── My Documents ─────────────────────────────────────────────────────────

    public function test_my_documents_shows_only_own_documents(): void
    {
        $employee1 = $this->staffUser();
        $employee2 = $this->staffUser();

        $this->makeDocument($employee1, ['title' => 'Mine']);
        $this->makeDocument($employee2, ['title' => 'Theirs']);

        $this->actingAs($employee1)
            ->get('/my-documents')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('MyDocumentsPage')
                ->where('documents', fn ($docs) => collect($docs)->contains('title', 'Mine') &&
                    ! collect($docs)->contains('title', 'Theirs')
                )
            );
    }

    // ── E-Signature: Sign ────────────────────────────────────────────────────

    public function test_employee_can_sign_a_pending_document(): void
    {
        $employee = $this->staffUser();
        $doc = $this->makeDocument($employee, ['requires_signature' => true]);

        DocumentSignature::create([
            'document_id' => $doc->id,
            'signee_id' => $employee->id,
            'status' => 'pending',
        ]);

        $this->actingAs($employee)
            ->post("/my-documents/{$doc->id}/sign")
            ->assertRedirect();

        $this->assertDatabaseHas('document_signatures', [
            'document_id' => $doc->id,
            'signee_id' => $employee->id,
            'status' => 'signed',
        ]);
    }

    public function test_employee_cannot_sign_a_document_not_assigned_to_them(): void
    {
        $owner = $this->staffUser();
        $other = $this->staffUser();
        $doc = $this->makeDocument($owner, ['requires_signature' => true]);

        DocumentSignature::create([
            'document_id' => $doc->id,
            'signee_id' => $owner->id,
            'status' => 'pending',
        ]);

        $this->actingAs($other)
            ->post("/my-documents/{$doc->id}/sign")
            ->assertForbidden();
    }

    // ── E-Signature: Decline ─────────────────────────────────────────────────

    public function test_employee_can_decline_a_pending_document(): void
    {
        $employee = $this->staffUser();
        $doc = $this->makeDocument($employee, ['requires_signature' => true]);

        DocumentSignature::create([
            'document_id' => $doc->id,
            'signee_id' => $employee->id,
            'status' => 'pending',
        ]);

        $this->actingAs($employee)
            ->post("/my-documents/{$doc->id}/decline", ['reason' => 'I disagree with clause 4.'])
            ->assertRedirect();

        $this->assertDatabaseHas('document_signatures', [
            'document_id' => $doc->id,
            'signee_id' => $employee->id,
            'status' => 'declined',
            'decline_reason' => 'I disagree with clause 4.',
        ]);
    }

    public function test_decline_records_are_immutable_no_updated_at(): void
    {
        $sig = new DocumentSignature([
            'document_id' => 1,
            'signee_id' => 1,
            'status' => 'pending',
        ]);

        $this->assertNull(DocumentSignature::UPDATED_AT);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    public function test_hr_can_delete_a_document(): void
    {
        $employee = $this->staffUser();
        $doc = $this->makeDocument($employee);
        Storage::disk('hr')->put($doc->file_path, 'content');

        $this->actingAs($this->hrUser())
            ->delete("/admin/hr/documents/{$doc->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('hr_documents', ['id' => $doc->id]);
        Storage::disk('hr')->assertMissing($doc->file_path);
    }

    public function test_staff_cannot_delete_documents(): void
    {
        $employee = $this->staffUser();
        $doc = $this->makeDocument($employee);

        $this->actingAs($employee)
            ->delete("/admin/hr/documents/{$doc->id}")
            ->assertForbidden();
    }

    // ── Document categories seeder ───────────────────────────────────────────

    public function test_document_category_seeder_creates_expected_categories(): void
    {
        $this->assertDatabaseHas('document_categories', ['code' => 'CONTRACT', 'requires_signature' => true]);
        $this->assertDatabaseHas('document_categories', ['code' => 'PAYSLIP',  'requires_signature' => false]);
        $this->assertGreaterThanOrEqual(10, DocumentCategory::count());
    }

    // ── Model helpers ────────────────────────────────────────────────────────

    public function test_document_is_pending_signature_for_user(): void
    {
        $employee = $this->staffUser();
        $doc = $this->makeDocument($employee, ['requires_signature' => true]);

        DocumentSignature::create([
            'document_id' => $doc->id,
            'signee_id' => $employee->id,
            'status' => 'pending',
        ]);

        $this->assertTrue($doc->isPendingSignatureFrom($employee->id));
    }

    public function test_user_has_hr_documents_relationship(): void
    {
        $employee = $this->staffUser();
        $doc = $this->makeDocument($employee);

        $this->assertTrue($employee->hrDocuments()->where('id', $doc->id)->exists());
    }

    public function test_user_has_document_signatures_relationship(): void
    {
        $employee = $this->staffUser();
        $doc = $this->makeDocument($employee, ['requires_signature' => true]);

        $sig = DocumentSignature::create([
            'document_id' => $doc->id,
            'signee_id' => $employee->id,
            'status' => 'pending',
        ]);

        $this->assertTrue($employee->documentSignatures()->where('id', $sig->id)->exists());
    }
}
