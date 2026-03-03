import { TicketForm } from '@/components/ticket-form';

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <TicketForm />
    </div>
  );
}
