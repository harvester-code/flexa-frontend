import React from 'react';
import {
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface PagingProps {
  currentPage: number; // 현재 페이지
  totalPage: number; // 총 페이지 수
}

export default function Paging({ currentPage, totalPage }: PagingProps) {
  return (
    <div className="paging">
      <button className="arrow-button">
        <FontAwesomeIcon className="icon-14" icon={faAnglesLeft} />
      </button>
      <button className="arrow-button">
        <FontAwesomeIcon className="icon-14" icon={faAngleLeft} />
      </button>
      {Array.from({ length: totalPage }, (_, index) => (
        <button
          key={index + 1}
          className={`paging-button ${currentPage === index + 1 ? 'active' : ''}`}
        >
          {index + 1}
        </button>
      ))}
      <button className="arrow-button">
        <FontAwesomeIcon className="icon-14" icon={faAngleRight} />
      </button>
      <button className="arrow-button">
        <FontAwesomeIcon className="icon-14" icon={faAnglesRight} />
      </button>
    </div>
  );
}
