<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder
{
    public function run(): void
    {
        // Get all users
        $users = User::all();

        if ($users->count() < 2) {
            $this->command->warn('Not enough users to create conversations. Please seed users first.');

            return;
        }

        // Create global conversations
        $hrAnnouncements = Conversation::create([
            'type' => 'group',
            'name' => 'HR Announcements',
            'is_read_only' => true,
            'is_global' => true,
        ]);

        $support = Conversation::create([
            'type' => 'group',
            'name' => 'Support',
            'is_global' => true,
        ]);

        // Create department-specific team chats
        $departments = ['Tech', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'];
        $teamChats = [];

        foreach ($departments as $dept) {
            $teamChats[$dept] = Conversation::create([
                'type' => 'group',
                'name' => "{$dept} Team",
                'department' => $dept,
                'is_global' => false,
            ]);
        }

        // Add all users to global conversations
        foreach ($users as $user) {
            $hrAnnouncements->participants()->attach($user->id);
            $support->participants()->attach($user->id);

            // Add users to their department team chat
            if ($user->department && isset($teamChats[$user->department])) {
                $teamChats[$user->department]->participants()->attach($user->id);
            }
        }

        // Create some sample messages for HR Announcements
        $hrUser = $users->where('role', 'hr')->first() ?? $users->first();

        Message::create([
            'conversation_id' => $hrAnnouncements->id,
            'user_id' => $hrUser->id,
            'content' => '🎉 Benefits enrollment is now open! Please review your options by November 15th.',
        ]);

        Message::create([
            'conversation_id' => $hrAnnouncements->id,
            'user_id' => $hrUser->id,
            'content' => 'Reminder: Holiday schedule will be posted next week.',
        ]);

        // Create sample messages for Support
        Message::create([
            'conversation_id' => $support->id,
            'user_id' => $hrUser->id,
            'content' => 'Welcome to Support! How can we help you today?',
        ]);

        // Create sample messages for Tech Team (if exists)
        if (isset($teamChats['Tech'])) {
            $techUsers = $users->where('department', 'Tech');
            if ($techUsers->count() > 0) {
                $firstTechUser = $techUsers->first();

                Message::create([
                    'conversation_id' => $teamChats['Tech']->id,
                    'user_id' => $firstTechUser->id,
                    'content' => 'Hey team, just pushed the latest updates to the evaluation module.',
                ]);

                if ($techUsers->count() > 1) {
                    $secondTechUser = $techUsers->skip(1)->first();
                    Message::create([
                        'conversation_id' => $teamChats['Tech']->id,
                        'user_id' => $secondTechUser->id,
                        'content' => 'Thanks! I\'ll review it this afternoon.',
                    ]);
                }
            }
        }

        $this->command->info('Chat conversations and messages seeded successfully!');
    }
}
