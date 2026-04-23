<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * RBAC is a platform foundation; feature tests that rely on system roles
     * should exercise the same seeded permission map used in production.
     */
    protected $seed = true;

    protected $seeder = \Database\Seeders\RolesAndPermissionsSeeder::class;
}
