"use client";
import Image from "next/image";

export default function TermsAndConditionsPage() {

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="space-y-5">
          <Image
            src="/images/logo.png"
            alt="Logo AutoCheck"
            width={170}
            height={170}
            className="mx-auto"
          />
          <h1 className="text-center text-xl sm:text-2xl text-black font-semibold">
            Términos y Condiciones
          </h1>
          <p className="text-center text-sm text-gray-500">
            Última actualización, 15 de septiembre de 2025
          </p>
        </div>

        {/* Content */}
        <div className="mt-6 sm:mt-8 space-y-8 text-gray-800">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">1. Aceptación</h2>
            <p className="text-sm leading-6">
              Al acceder, navegar o utilizar este sitio, aceptás estos Términos y Condiciones, también aceptás nuestra Política de Privacidad. 
              Si no estás de acuerdo, por favor no utilices el servicio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">2. Elegibilidad y cuenta</h2>
            <p className="text-sm leading-6">
              Para crear una cuenta debés ser mayor de edad según las leyes aplicables, debés proporcionar información veraz, completa y actualizada. 
              Sos responsable por mantener la confidencialidad de tus credenciales, también por toda actividad que ocurra bajo tu cuenta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">3. Uso permitido</h2>
            <p className="text-sm leading-6">
              Podés usar el servicio dentro de los límites legales, no está permitido realizar actividades que dañen, interrumpan o afecten el funcionamiento del sistema, 
              tampoco está permitido el acceso no autorizado a datos, cuentas o recursos del sitio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">4. Contenido del usuario</h2>
            <p className="text-sm leading-6">
              El contenido que publiques debe respetar derechos de terceros, no puede infringir propiedad intelectual, privacidad, ni incluir material ilegal, fraudulento o engañoso. 
              Nos otorgás una licencia limitada, no exclusiva y mundial para alojar y mostrar dicho contenido con el fin de operar el servicio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">5. Propiedad intelectual</h2>
            <p className="text-sm leading-6">
              Las marcas, logotipos, interfaces, diseños y software pertenecen a sus respectivos titulares, su uso no otorga licencias implícitas. 
              No podés copiar, modificar o distribuir partes del servicio sin autorización previa y por escrito.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">6. Pagos y facturación</h2>
            <p className="text-sm leading-6">
              Cuando corresponda, los precios pueden cambiar en cualquier momento, los impuestos y cargos aplicables se suman al precio publicado. 
              Los reembolsos, cuando existan, se procesan según la política vigente al momento de la compra.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">7. Garantías y responsabilidades</h2>
            <p className="text-sm leading-6">
              El servicio se ofrece en la medida permitida por la ley, se proporciona tal cual, con disponibilidad sujeta a mantenimiento, cambios y mejoras. 
              No garantizamos ausencia total de errores, interrupciones o vulnerabilidades, vos asumís los riesgos derivados del uso.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">8. Limitación de responsabilidad</h2>
            <p className="text-sm leading-6">
              En ningún caso seremos responsables por pérdidas de datos, lucro cesante, daños indirectos o consecuentes derivados del uso o imposibilidad de uso del servicio, 
              incluso si hubiéramos sido advertidos de la posibilidad de tales daños.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">9. Suspensión y terminación</h2>
            <p className="text-sm leading-6">
              Podemos suspender o cerrar tu cuenta por incumplimientos, por requerimientos legales, por riesgos para la seguridad. 
              Podés solicitar la baja en cualquier momento, la baja no exime obligaciones pendientes, por ejemplo pagos adeudados.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">10. Cambios en los términos</h2>
            <p className="text-sm leading-6">
              Podemos actualizar estos términos, publicaremos la versión vigente en este sitio. 
              Los cambios rigen desde su publicación, el uso continuado implica aceptación de la nueva versión.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">11. Ley aplicable y jurisdicción</h2>
            <p className="text-sm leading-6">
              Estos términos se rigen por las leyes de la República Argentina, cualquier disputa se somete a los tribunales competentes de la Ciudad Autónoma de Buenos Aires, 
              salvo norma de orden público en contrario.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">12. Contacto</h2>
            <p className="text-sm leading-6">
              Si tenés preguntas, escribinos a soporte@tudominio.com, indicá tu nombre, tu email de registro y una descripción clara de la consulta.
            </p>
          </section>
        </div>

      </div>
    </main>
  );
}
