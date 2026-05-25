import { Suspense } from "react";
import { AuthSplitLayout } from "../_components/AuthSplitLayout";
import { RoleLoginForm } from "../_components/RoleLoginForm";

function PsychologistLoginCard() {
  return (
    <RoleLoginForm
      expectedRole="PSYCHOLOGIST"
      signupHref="/cadastro/psicologo"
      alternateHref="/login/paciente"
    />
  );
}

export default function LoginPsicologoPage() {
  return (
    <AuthSplitLayout role="psicologo">
      <Suspense fallback={<div className="text-center p-5">Carregando...</div>}>
        <PsychologistLoginCard />
      </Suspense>
    </AuthSplitLayout>
  );
}
