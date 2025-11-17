"use client";
import Image from "next/image";

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-3xl bg-white rounded-[10px] border border-gray-200 shadow-sm px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="space-y-5">
          <Image
            src="/images/logo.svg"
            alt="Logo CheckRTO"
            width={170}
            height={180}
            className="mx-auto"
          />
          <h1 className="text-center text-xl sm:text-2xl text-black font-semibold">
            Términos y Condiciones
          </h1>
          <p className="text-center text-sm text-gray-500">
            Última actualización, 24 de septiembre de 2025
          </p>
        </div>

        {/* Content */}
        <div className="mt-6 sm:mt-8 space-y-8 text-gray-800">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">1. Uso del sistema</h2>
            <p className="text-sm leading-6">
              El Usuario se obliga a usar el sistema de Gestion Check RTO de conformidad con estos Términos y Condiciones, en forma correcta y lícita. En caso contrario, el Administrador podrá suspender la cuenta del Usuario, por considerarlo, violatorio de estos Términos y Condiciones y de la Política de Privacidad de estos Servicios Digitales, ofensivo, ilegal, violatorio de derechos de terceros, contrario a la moral y buenas costumbres y amenaza la seguridad de otros Usuarios.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">2. Seguridad y acceso</h2>
            <ul className="list-disc pl-5 text-sm leading-6 space-y-1">
              <li>No acceder a datos restringidos o a intentar violar las barreras de seguridad para llegar a ellos.</li>
              <li>No realizar búsquedas de vulnerabilidades o explotación de las mismas para cualquier fin.</li>
              <li>No divulgar información acerca de la detección de vulnerabilidades encontradas en los Servicios Digitales.</li>
              <li>Comunicar al Administrador toda información a la que tenga acceso que pudiera implicar un compromiso a la seguridad de la información o los servicios digitales del sistema de gestion.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">3. Identidad y datos personales</h2>
            <p className="text-sm leading-6">
              Intentar usurpar la identidad de otro Usuario, representando de manera falsa su afiliación con cualquier individuo o entidad, o Vulnerar los derechos establecidos en la Ley 25.326 de Protección de Datos Personales.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">4. Compromisos al momento de la inscripción</h2>
            <ul className="list-disc pl-5 text-sm leading-6 space-y-1">
              <li>No proporcionar información personal falsa ni crear cuentas a nombre de terceros.</li>
              <li>No crear más de una cuenta personal.</li>
              <li>No crear otra cuenta sin permiso expreso del Administrador, en caso de que este último haya inhabilitado la cuenta original.</li>
              <li>Mantener la información de contacto exacta y actualizada.</li>
              <li>No compartir la contraseña ni permitir a otra persona acceda a su cuenta.</li>
              <li>Utilizar el nombre de otro Usuario con el propósito de engañar.</li>
              <li>El Usuario se compromete a notificar al Administrador ante cualquier uso no autorizado de su clave.</li>
              <li>El Administrador se reserva el derecho de rechazar cualquier solicitud de inscripción o de cancelar un registro previamente aceptado.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">5. Propiedad intelectual</h2>
            <p className="text-sm leading-6">
              La expresión de ideas, procedimientos, métodos de operación y conceptos matemáticos de conformidad con lo establecido en el artículo 1º de la Ley 11.723 y sus modificatorias, así como las marcas, avisos, nombres comerciales, publicidad, dibujos, diseños, logotipos, textos, entre otros, que aparecen en los Sistema de Gestión Check RTO, son propiedad del Administrador.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">6. Ley aplicable, jurisdicción y modificaciones</h2>
            <p className="text-sm leading-6">
              Los Términos y Condiciones de Uso aquí presentados se rigen por las leyes de la República Argentina. En caso de surgir cualquier controversia respecto de la interpretación o cumplimiento de los presentes, el Administrador y el Usuario se someten a los Tribunales Nacionales en lo Contencioso Administrativo. El Administrador se reserva el derecho de modificar en cualquier momento la presente Política de Privacidad y los términos y condiciones, comprometiéndose a anunciarlo por medio de un aviso en el activo digital que corresponda.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">7. Sanciones</h2>
            <p className="text-sm leading-6">
              Las infracciones por acción u omisión de los presentes Términos y Condiciones de Uso generarán el derecho a favor del Administrador de suspender al Usuario que las haya realizado.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
