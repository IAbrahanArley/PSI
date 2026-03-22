import type { Metadata } from "next";

import "../../public/assets/css/style.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Mindzinho - Agende sua consulta",
  description: "Mindzinho é um sistema de agendamento de consultas online para profissionais de saúde. Ideal para psicólogos, psiquiatras, enfermeiros, enfermeiros, e outros profissionais de saúde.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme-color="skin-1" className={cn("font-sans", geist.variable)}>
       <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"></link>
      </head>
      <body id="bg">
        {children}
      </body>
    </html>
  );
}
