'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { faAngleDown, faAngleRight, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signOutAction } from '@/api/auth';
import NavIcon01 from '@/components/Icons/NavIcon01';
import NavIcon02 from '@/components/Icons/NavIcon02';
import NavIcon03 from '@/components/Icons/NavIcon03';
import NavIcon04 from '@/components/Icons/NavIcon04';
import NavIcon05 from '@/components/Icons/NavIcon05';
import NavIcon06 from '@/components/Icons/NavIcon06';
import SearchIcon from '@/components/Icons/Search';
import { Button } from '@/components/UIs/Button';
import { createClient } from '@/lib/supabase-client';
import { TUserInfo, useUserInfo } from '@/store/zustand';

interface ISideNavigationProps {
  userInfo: TUserInfo;
}

export default function SideNavigation({ userInfo }: ISideNavigationProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMyMenuOpen, setIsMyMenuOpen] = useState(false);
  const { setUserInfo, setAccessToken } = useUserInfo();

  useEffect(() => {
    setUserInfo(userInfo);

    const initSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAccessToken(session?.access_token || '');
    };

    initSession();
  }, [userInfo]);

  // TODO: 네비게이션 메뉴 map으로 만들기
  return (
    <div
      id="navigation"
      className={isHovered ? '' : 'default'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsInputFocused(false);
        setIsOpen(false);
        setIsMyMenuOpen(false);
      }}
    >
      <h1>
        <Link href="/">
          <Image src="/image/img-logo-nav.svg" alt="flexa" width={100} height={100} />
        </Link>
      </h1>

      <div className={`search-box ${isInputFocused ? 'active' : ''}`}>
        <input
          type="text"
          placeholder="Search"
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
        <button className="text-secondary">
          <div className="search-icon">
            <SearchIcon />
          </div>
        </button>
      </div>

      <ul className="gnb-list mt-[20px]">
        <li className="active">
          <Link href="/protected/home">
            <NavIcon01 />
            <span className="text">Home</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li>

        <li>
          <Link href="/protected/facility">
            <NavIcon02 />
            <span className="text">Detailed Facilities</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li>

        <li>
          <Link href="/protected/passenger-flow">
            <NavIcon03 />
            <span className="text">Passenger Flow</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li>

        <li>
          <Link href="/protected/simulation">
            <NavIcon04 />
            <span className="text">Simulation</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li>
      </ul>

      <hr />

      <ul className="gnb-list">
        <li>
          <Link href="/protected/messenger">
            <NavIcon05 />
            <span className="text">Messenger</span>
            <span className="number">959+</span>
          </Link>
        </li>
        <li className={`settings ${isOpen ? 'active' : ''}`}>
          <a onClick={() => setIsOpen((prev) => !prev)}>
            <NavIcon06 />
            <span className="text">Settings</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleDown} />
          </a>

          <ul className="sub-menu">
            <li>
              <a href="#">User Management</a>
            </li>
            <li>
              <a href="#">Request Management</a>
            </li>
            <li>
              <a href="#">Operation Settings</a>
            </li>
          </ul>
        </li>
      </ul>

      <div className={`my-menu ${isMyMenuOpen ? 'active' : ''}`}>
        <button
          onClick={() => {
            setIsMyMenuOpen((prev) => !prev);
            setIsOpen(false);
          }}
        >
          <span className="profile-icon">{userInfo?.initials}</span>
          <span className="text-sm font-semibold text-tertiary">{userInfo?.fullName}</span>
          <div className="up-down-icon ml-auto">
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleUp} />
          </div>
        </button>

        <div className="my-menu-list">
          <div className="my-name">
            <div className="profile-photo">
              <span className="photo">{userInfo?.initials}</span>
              <span className="online"></span>
            </div>
            <dl>
              <dt>{userInfo?.fullName}</dt>
              <dd>{userInfo?.email}</dd>
            </dl>
          </div>

          <div className="my-menu-nav">
            <Link href="/protected/profile">
              <Image src="/image/ico-profile-01.svg" alt="profile" width={16} height={16} />
              Profile
            </Link>
            <hr />
            <a href="#">
              <Image src="/image/ico-profile-02.svg" alt="simulation" width={16} height={16} />
              Simulation Mangement
            </a>
            <a href="#">
              <Image src="/image/ico-profile-03.svg" alt="filter" width={16} height={16} />
              Fliter Management
            </a>
            <a href="#">
              <Image src="/image/ico-profile-04.svg" alt="trash" width={16} height={16} />
              Trash Bin
            </a>
            <hr />
            <a href="#">
              <Image src="/image/ico-profile-05.svg" alt="support" width={16} height={16} />
              Support
            </a>
          </div>

          <form action={signOutAction}>
            <Button className="logout" type="submit" variant={'outline'}>
              <Image src="/image/ico-profile-06.svg" alt="logout" width={16} height={16} />
              Log out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
