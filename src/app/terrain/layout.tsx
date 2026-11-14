import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terrain Intelligence Module | Crestix Probe',
  description:
    'Interactive 3D topographic workspace for digital elevation modeling, slope gradient analysis, drainage network discovery, and flood simulation preparation.'
};

export default function TerrainLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full min-h-screen bg-slate-950">{children}</div>;
}
