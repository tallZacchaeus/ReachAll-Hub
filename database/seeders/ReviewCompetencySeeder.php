<?php

namespace Database\Seeders;

use App\Models\ReviewCompetency;
use Illuminate\Database\Seeder;

class ReviewCompetencySeeder extends Seeder
{
    public function run(): void
    {
        $competencies = [
            ['Communication',    'communication',    'Clarity and effectiveness in written and verbal communication', 1],
            ['Teamwork',         'teamwork',          'Collaboration, support of colleagues, and team contribution',  2],
            ['Problem Solving',  'problem_solving',   'Analytical thinking and ability to resolve challenges',        3],
            ['Initiative',       'initiative',        'Proactive approach to identifying opportunities and acting',   4],
            ['Quality of Work',  'quality_of_work',   'Accuracy, thoroughness, and consistency of output',           5],
            ['Time Management',  'time_management',   'Meeting deadlines and prioritising effectively',               6],
            ['Leadership',       'leadership',        'Guiding, motivating, and developing others',                   7],
            ['Technical Skills', 'technical_skills',  'Proficiency in role-specific tools, systems, and knowledge',  8],
        ];

        foreach ($competencies as [$name, $slug, $description, $sort]) {
            ReviewCompetency::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'description' => $description,
                    'is_active' => true,
                    'sort_order' => $sort,
                ],
            );
        }
    }
}
