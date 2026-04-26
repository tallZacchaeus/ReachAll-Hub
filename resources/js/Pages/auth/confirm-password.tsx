import ConfirmPasswordInner from '@/Pages_starter/auth/confirm-password';
import type { ReactNode } from 'react';

// Explicit layout prevents this page from inheriting MainLayout when reached
// via a password-confirmation redirect during an Inertia SPA navigation.
function ConfirmPassword() {
    return <ConfirmPasswordInner />;
}
ConfirmPassword.layout = (page: ReactNode) => <>{page}</>;

export default ConfirmPassword;
