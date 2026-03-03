'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTicket } from '@/lib/api';

const ticketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be at most 5000 characters'),
  customer_email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .transform((v) => v.toLowerCase()),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export function TicketForm() {
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
  });

  const onSubmit = async (data: TicketFormValues) => {
    try {
      const ticket = await createTicket(data);
      setSubmittedId(ticket.id);
      reset();
      toast.success('Ticket submitted successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit ticket';
      toast.error(message);
    }
  };

  if (submittedId) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-green-600">Ticket Submitted!</CardTitle>
          <CardDescription>
            Your support ticket has been created and will be reviewed shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ticket ID:{' '}
            <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{submittedId}</code>
          </p>
          <Button variant="outline" onClick={() => setSubmittedId(null)}>
            Submit Another Ticket
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Submit a Support Ticket</CardTitle>
        <CardDescription>
          Describe your issue and we&apos;ll route it to the right team using AI triage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Brief summary of your issue" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide details about the problem you're experiencing..."
              rows={5}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_email">Email</Label>
            <Input
              id="customer_email"
              type="email"
              placeholder="you@example.com"
              {...register('customer_email')}
            />
            {errors.customer_email && (
              <p className="text-sm text-destructive">{errors.customer_email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
