import type { ReactNode } from "react";

/** Celular: una columna. Computadora: formulario de 480 px a la izquierda y `aside` a la derecha. */
export function AuthColumns({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:items-start lg:gap-16">
      <div className="flex flex-col gap-6">{children}</div>
      {aside}
    </div>
  );
}
