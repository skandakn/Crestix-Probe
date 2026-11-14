import { Metadata } from 'next';
import { ForecastingWorkspace } from '@/features/forecasting/components/forecasting-workspace';

export const metadata: Metadata = {
  title: 'AI Forecasting Workspace | Crestix Probe',
  description:
    'Physics-informed AI forecasting module for flood-depth and propagation using Fourier Neural Operators (FNO) and PINO architectures.'
};

export default function ForecastingPage() {
  return <ForecastingWorkspace />;
}

