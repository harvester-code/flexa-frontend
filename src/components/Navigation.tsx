import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { faAngleDown, faAngleRight, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NavIcon01 from '@/components/icons/NavIcon01';
import NavIcon02 from '@/components/icons/NavIcon02';
import NavIcon03 from '@/components/icons/NavIcon03';
import NavIcon04 from '@/components/icons/NavIcon04';
import NavIcon05 from '@/components/icons/NavIcon05';
import NavIcon06 from '@/components/icons/NavIcon06';
import SearchIcon from '@/components/icons/Search';

// 네비게이션 컴포넌트
const Navigation: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMyMenuOpen, setIsMyMenuOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
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
          <Image priority width={100} height={100} src="/image/img-logo-nav.svg" alt="flexa" />
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
          <Link href="/">
            <NavIcon01 />
            <span className="text">Home</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li>
        <li>
          <a href="#">
            <NavIcon02 />
            <span className="text">Detailed Facilities</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </a>
        </li>
        <li>
          <a href="#">
            <NavIcon03 />
            <span className="text">Passenger Flow</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </a>
        </li>
        <li>
          <a href="#">
            <NavIcon04 />
            <span className="text">Simulation</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </a>
        </li>
      </ul>
      <hr />
      <ul className="gnb-list">
        <li>
          <a href="#">
            <NavIcon05 />
            <span className="text">Messenger</span>
            <span className="number">959+</span>
          </a>
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
          <span className="profile-icon">DP</span>
          <span className="text-sm font-semibold text-tertiary">Danny Park</span>
          <div className="up-down-icon ml-auto">
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleUp} />
          </div>
        </button>
        <div className="my-menu-list">
          <div className="my-name">
            <div className="profile-photo">
              <span className="photo">DP</span>
              <span className="online"></span>
            </div>
            <dl>
              <dt>Danny Park</dt>
              <dd>danny@datamarketing.co.kr</dd>
            </dl>
          </div>
          <div className="my-menu-nav">
            <a href="#">
              <Image width={16} height={16} src="/image/ico-profile-01.svg" alt="profile" />
              Profile
            </a>
            <hr />
            <a href="#">
              <Image width={16} height={16} src="/image/ico-profile-02.svg" alt="simulation" />
              Simulation Mangement
            </a>
            <a href="#">
              <Image width={16} height={16} src="/image/ico-profile-03.svg" alt="filter" />
              Fliter Management
            </a>
            <a href="#">
              <Image width={16} height={16} src="/image/ico-profile-04.svg" alt="trash" />
              Trash Bin
            </a>
            <hr />
            <a href="#">
              <Image width={16} height={16} src="/image/ico-profile-05.svg" alt="support" />
              Support
            </a>
          </div>
          <button className="logout">
            <Image width={16} height={16} src="/image/ico-profile-06.svg" alt="logout" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
