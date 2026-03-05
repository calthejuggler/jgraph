import { useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { GithubIcon, MailIcon, MessageSquareIcon, SendIcon } from "lucide-react";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { API_URL } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { contactSchema, type ContactValues } from "@/lib/schemas";

import { m } from "@/paraglide/messages.js";

export function FooterPanel() {
  return (
    <div className="fixed right-4 bottom-4 z-40 flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <a
          href="https://github.com/calthejuggler/juggling-tools"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubIcon />
          {m.footer_github()}
        </a>
      </Button>
      <ContactDialog />
    </div>
  );
}

function ContactDialog() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const { data: session, isPending } = useSession();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSent(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquareIcon />
          {m.footer_contact()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{m.contact_title()}</DialogTitle>
          <DialogDescription>{m.contact_description()}</DialogDescription>
        </DialogHeader>

        {sent ? (
          <p className="text-sm text-green-600 dark:text-green-400">{m.contact_success()}</p>
        ) : isPending ? null : (
          <ContactForm
            defaultName={session?.user?.name ?? ""}
            defaultEmail={session?.user?.email ?? ""}
            onSuccess={() => setSent(true)}
          />
        )}

        <Separator />

        <div className="text-muted-foreground text-sm">
          <p className="text-foreground font-medium">{m.contact_custom_title()}</p>
          <p className="mt-1">{m.contact_custom_description()}</p>
          <a
            href="mailto:calthejuggler@gmail.com"
            className="text-primary mt-2 inline-flex items-center gap-1.5 hover:underline"
          >
            <MailIcon className="size-4" />
            calthejuggler@gmail.com
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContactForm({
  defaultName,
  defaultEmail,
  onSuccess,
}: {
  defaultName: string;
  defaultEmail: string;
  onSuccess: () => void;
}) {
  const [error, setError] = useState(false);
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema()),
    defaultValues: { name: defaultName, email: defaultEmail, message: "" },
  });

  async function onSubmit(values: ContactValues) {
    setError(false);
    try {
      const res = await fetch(`${API_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      onSuccess();
    } catch {
      setError(true);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
      <FormField
        name="name"
        control={form.control}
        label={m.contact_name_label()}
        placeholder={m.contact_name_placeholder()}
      />
      <FormField
        name="email"
        control={form.control}
        label={m.contact_email_label()}
        type="email"
        placeholder={m.contact_email_placeholder()}
      />
      <FormField
        name="message"
        control={form.control}
        label={m.contact_message_label()}
        placeholder={m.contact_message_placeholder()}
        multiline
        rows={4}
      />
      {error && !form.formState.isSubmitting && (
        <p className="text-destructive text-sm">{m.contact_error()}</p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        <SendIcon />
        {form.formState.isSubmitting ? m.contact_sending() : m.contact_send()}
      </Button>
    </form>
  );
}
