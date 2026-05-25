import { Suspense } from "react";
import { AuthSplitLayout } from "../_components/AuthSplitLayout";
import { RoleLoginForm } from "../_components/RoleLoginForm";

function PatientLoginCard() {
  return (
    <RoleLoginForm
      expectedRole="PATIENT"
      signupHref="/cadastro/paciente"
      alternateHref="/login/psicologo"
    />
  );
}

export default function LoginPacientePage() {
  return (
    <AuthSplitLayout role="paciente">
      <Suspense fallback={<div className="text-center p-5">Carregando...</div>}>
        <PatientLoginCard />
      </Suspense>
    </AuthSplitLayout>
  );
}
