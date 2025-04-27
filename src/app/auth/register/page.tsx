import { redirect } from 'next/navigation';

// import Image from 'next/image';
// import { BackToLogin } from '@/components/BackToLogin';
// import { RegisterForm } from './_components/register-form';

export default function RegisterPage() {
  return redirect('/auth/login');

  // return (
  //   <div className="signUpContainer">
  //     <h1>
  //       <Image src="/image/img-logo.svg" alt="logo" height={100} width={100} />
  //     </h1>
  //     <ul className="loginStep">
  //       <li className={`${currentStep >= 1 ? 'active' : ''} bar-on`}>
  //         <img src="/image/ico-signSetp-01.svg" alt="" />
  //         Enter Personal Information
  //       </li>
  //       <li className={`${currentStep >= 2 ? 'active' : ''}`}>
  //         <img src="/image/ico-signSetp-02.svg" alt="" />
  //         Verify Email
  //       </li>
  //       <li className={`${currentStep >= 3 ? 'active' : ''}`}>
  //         <img src="/image/ico-signSetp-03.svg" alt="" />
  //         Set Password
  //       </li>
  //       <li className={`${currentStep >= 4 ? 'active' : ''}`}>
  //         <img src="/image/ico-signSetp-04.svg" alt="" />
  //         Send Request Approval
  //       </li>
  //     </ul>
  //     <h2 className="title">Sign Up</h2>
  //     <p className="mt-5 font-medium">Enter your name and email to get started with the solution.</p>
  //     <RegisterForm />
  //     <BackToLogin />
  //   </div>
  // );
}
