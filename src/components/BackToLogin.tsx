import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

interface BackToLoginProps {
  className?: string;
}

export function BackToLogin({ className = 'mt-5' }: BackToLoginProps) {
  return (
    <Link href="/" className={`btn-link ${className}`}>
      <FontAwesomeIcon className="nav-icon" icon={faArrowLeft} />
      Back to Login
    </Link>
  );
}
