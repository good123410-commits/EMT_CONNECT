import { useState } from 'react';
import type { DonationAccount } from '../types';

type DonationAccountCardProps = {
  account: DonationAccount;
};

export function DonationAccountCard({ account }: DonationAccountCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(account.account_number.replace(/-/g, ''));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = account.account_number;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="donation-card">
      <div className="donation-card-header">
        <span className="donation-card-bank">{account.bank_name}</span>
        {account.purpose ? (
          <span className="donation-card-purpose">{account.purpose}</span>
        ) : null}
      </div>
      <p className="donation-card-number">{account.account_number}</p>
      <p className="donation-card-holder">예금주: {account.account_holder}</p>
      <button type="button" className="btn btn-primary donation-card-copy" onClick={handleCopy}>
        {copied ? '복사 완료 ✓' : '계좌번호 복사'}
      </button>
    </article>
  );
}
