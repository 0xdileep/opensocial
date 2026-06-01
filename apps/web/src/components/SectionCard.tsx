import { PropsWithChildren } from 'react';

export function SectionCard({ children }: PropsWithChildren) {
  return <section className="card">{children}</section>;
}
