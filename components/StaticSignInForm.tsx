"use client";

import type {FormEvent} from "react";
import {useRouter} from "@/i18n/navigation";

type SignInCopy = {
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  remember: string;
  forgot: string;
  submit: string;
};

export default function StaticSignInForm({copy, locale}: {copy: SignInCopy; locale: string}) {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/dashboard", {locale});
  }

  return (
    <form className="signin-form" onSubmit={handleSubmit}>
      <label>
        <span>{copy.email}</span>
        <input
          autoComplete="email"
          dir="ltr"
          name="email"
          placeholder={copy.emailPlaceholder}
          required
          type="email"
        />
      </label>
      <label>
        <span>{copy.password}</span>
        <input
          autoComplete="current-password"
          name="password"
          placeholder={copy.passwordPlaceholder}
          required
          type="password"
        />
      </label>

      <div className="signin-options">
        <label className="signin-remember">
          <input name="remember" type="checkbox" />
          <span>{copy.remember}</span>
        </label>
        <button className="signin-forgot" type="button">{copy.forgot}</button>
      </div>

      <button className="signin-submit" type="submit">{copy.submit}</button>
    </form>
  );
}
