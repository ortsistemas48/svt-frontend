"use client";

import Image from "next/image";
import Link from "next/link";

export default function PoliticasPrivacidadPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-3xl bg-white rounded-[14px] border border-gray-200 shadow-sm px-4 py-6 sm:px-6 sm:py-10">
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
            Políticas de Privacidad
          </h1>
          <p className="text-center text-sm text-gray-500">
            Última actualización: enero de 2026
          </p>
        </div>

        {/* Content */}
        <div className="mt-6 sm:mt-8 space-y-8 text-gray-800">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">1. Responsable del tratamiento</h2>
            <p className="text-sm leading-6">
              Los datos personales que recogemos a través del sistema de gestión CheckRTO son tratados por el Administrador del servicio, en cumplimiento de la Ley 25.326 de Protección de Datos Personales de la República Argentina y su normativa complementaria.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">2. Datos que recogemos</h2>
            <p className="text-sm leading-6">
              Recopilamos únicamente los datos necesarios para brindar el servicio, gestionar usuarios y talleres, y cumplir con las obligaciones legales aplicables.
            </p>
            <h3 className="text-base font-medium text-gray-900 mt-4">2.1 Registro de usuarios (propietarios y personal)</h3>
            <ul className="list-disc pl-5 text-sm leading-6 space-y-1">
              <li><strong>Identificación:</strong> nombre/s, apellido/s, DNI.</li>
              <li><strong>Contacto:</strong> correo electrónico, número de teléfono (cuando se proporcione).</li>
              <li><strong>Cuenta:</strong> contraseña (almacenada de forma segura, no en texto plano).</li>
              <li><strong>Para ingenieros:</strong> número de matrícula, título universitario, y tipo de ingeniero (titular o suplente) cuando corresponda.</li>
            </ul>
            <h3 className="text-base font-medium text-gray-900 mt-4">2.2 Registro de talleres</h3>
            <ul className="list-disc pl-5 text-sm leading-6 space-y-1">
              <li><strong>Identificación del taller:</strong> nombre identificatorio, razón social, CUIT.</li>
              <li><strong>Ubicación:</strong> provincia, localidad, domicilio completo.</li>
              <li><strong>Contacto:</strong> teléfono del taller.</li>
              <li><strong>Datos regulatorios:</strong> número de planta, número de disposición.</li>
            </ul>
            <p className="text-sm leading-6 mt-3">
              Además, en el uso del sistema podemos procesar datos vinculados a inspecciones, vehículos, documentación y operaciones que los usuarios cargan para la gestión del taller, siempre dentro del marco del servicio contratado.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">3. Finalidad del tratamiento</h2>
            <ul className="list-disc pl-5 text-sm leading-6 space-y-1">
              <li>Crear y mantener cuentas de usuario y acceso al sistema.</li>
              <li>Registrar y administrar talleres de Revisión Técnica Obligatoria (RTO).</li>
              <li>Gestionar roles (titular, ingeniero, administrativo, personal de planta) y permisos.</li>
              <li>Comunicarnos con los usuarios (verificación de email, recuperación de contraseña, avisos del servicio).</li>
              <li>Cumplir con obligaciones legales y normativas aplicables al sector.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">4. Conservación de los datos</h2>
            <p className="text-sm leading-6">
              Conservamos los datos personales mientras sea necesario para la finalidad indicada y para cumplir con las obligaciones legales (por ejemplo, plazos de retención fiscales o regulatorios). Una vez que ya no resulten necesarios, se procederá a su supresión o anonimización de acuerdo con la ley.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">5. Derechos del titular de los datos</h2>
            <p className="text-sm leading-6">
              De conformidad con la Ley 25.326, el titular de los datos personales tiene derecho a acceder a sus datos, a solicitar su rectificación, actualización o supresión cuando corresponda, y a oponerse al tratamiento o a solicitar la confidencialidad. Para ejercer estos derechos puede contactarnos a través del canal de contacto indicado en esta web (por ejemplo, el formulario de contacto o WhatsApp).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">6. Seguridad</h2>
            <p className="text-sm leading-6">
              Aplicamos medidas técnicas y organizativas razonables para proteger los datos personales contra acceso no autorizado, pérdida, alteración o divulgación. Las contraseñas se almacenan utilizando mecanismos seguros (por ejemplo, hash) y no se comparten con terceros.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">7. Cesión y terceros</h2>
            <p className="text-sm leading-6">
              No vendemos ni alquilamos sus datos personales. Podemos compartir información únicamente cuando sea necesario para el funcionamiento del servicio (por ejemplo, proveedores técnicos que procesan datos en nuestro nombre bajo contrato) o cuando la ley lo exija.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">8. Modificaciones</h2>
            <p className="text-sm leading-6">
              Nos reservamos el derecho de actualizar esta política de privacidad. Los cambios relevantes se comunicarán mediante un aviso en el sitio o por los medios de contacto habituales. Se recomienda revisar periódicamente esta página.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">9. Contacto</h2>
            <p className="text-sm leading-6">
              Para consultas sobre el tratamiento de sus datos personales o para ejercer sus derechos, puede contactarnos a través de la sección de contacto del sitio o por WhatsApp al número indicado en el pie de página.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link
            href="/"
            className="text-sm text-[#0040B8] hover:underline"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
