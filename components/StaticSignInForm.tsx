"use client";

import {useActionState} from "react";

import {signInAction} from "@/app/auth-actions";

type SignInCopy = {
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  remember: string;
  forgot: string;
  submit: string;
  submitting: string;
};

export default function StaticSignInForm({copy, locale}: {copy: SignInCopy; locale: string}) {
  const [state, formAction, pending] = useActionState(signInAction, {});

  return (
    <form action={formAction} className="signin-form">
      <input name="locale" type="hidden" value={locale} />
      <label>
        <span>{copy.email}</span>
        <input
          autoComplete="username"
          dir="ltr"
          name="email"
          placeholder={copy.emailPlaceholder}
          required
          type="text"
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

      {state.error ? <p className="signin-error" role="alert">{state.error}</p> : null}
      <button className="signin-submit" disabled={pending} type="submit">
        {pending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
