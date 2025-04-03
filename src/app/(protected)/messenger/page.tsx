'use client';

import React, { useState } from 'react';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Divider, Menu, MenuItem, Typography } from '@mui/material';
import Input from '@/components/Input';
import AddPeople from '@/components/popups/addPeople';
import './styles.css';

const MessengerPage: React.FC = () => {
  const [anchorEl1, setAnchorEl1] = useState<HTMLElement | null>(null);
  const [anchorEl2, setAnchorEl2] = useState<HTMLElement | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [message, setMessage] = useState('');
  const [openPopups, setOpenPopups] = useState<{ [key: string]: boolean }>({});

  const handleClick1 = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl1(event.currentTarget);
  };

  const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose1 = () => {
    setAnchorEl1(null);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleOpen = (popupType: string): void => {
    setOpenPopups((prev) => ({ ...prev, [popupType]: true }));
  };

  const handleClose = (popupType: string): void => {
    setOpenPopups((prev) => ({ ...prev, [popupType]: false }));
  };

  const createCloseHandler = (popupType: string) => () => handleClose(popupType);

  return (
    <>
      <div id="container">
        <section id="messenger">
          <div className="messenger-header">
            <div className="messges">
              <h2>
                Messages <span>40</span>
              </h2>
              <button>
                <img src="/image/ico-edit.svg" alt="edit" />
              </button>
            </div>
            <div className="search-msg">
              <Input
                type="text"
                placeholder="Search"
                value={searchValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
              />
              <button onClick={() => {}}>
                <img src="/image/ico-search.svg" alt="search" />
              </button>
            </div>
            <div className="chat-list">
              <div className="chat-list-item">
                <div className="item-header">
                  <p className="bulit">
                    <span className="chat"></span>
                  </p>
                  <p className="user-photo">
                    DP <span className="online"></span>
                  </p>
                  <dl className="user-name">
                    <dt>Danny Park</dt>
                    <dd>danny@datamarketing.co.kr</dd>
                  </dl>
                  <p className="time">5min ago</p>
                </div>
                <p className="last-chat">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore itaque libero quaerat
                  sapiente voluptas reiciendis quas doloremque, repellat vero illo a perspiciatis. Doloremque
                  laudantium sed dolorem pariatur? Placeat, vero eaque?
                </p>
              </div>
              <div className="chat-list-item active">
                <div className="item-header">
                  <p className="bulit">{/* <span className="chat"></span> */}</p>
                  <p className="user-photo">
                    BH <span className="online"></span>
                  </p>
                  <dl className="user-name">
                    <dt>Billbo Han</dt>
                    <dd>danny@datamarketing.co.kr</dd>
                  </dl>
                  <p className="time">5min ago</p>
                </div>
                <p className="last-chat">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore itaque libero quaerat
                  sapiente voluptas reiciendis quas doloremque, repellat vero illo a perspiciatis. Doloremque
                  laudantium sed dolorem pariatur? Placeat, vero eaque?
                </p>
              </div>
              <div className="chat-list-item">
                <div className="item-header">
                  <p className="bulit">
                    <span className="chat"></span>
                  </p>
                  <p className="user-photo">
                    TK <span className="online"></span>
                  </p>
                  <dl className="user-name">
                    <dt>Theo Kim</dt>
                    <dd>@mobile</dd>
                  </dl>
                  <p className="time">5min ago</p>
                </div>
                <p className="last-chat">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore itaque libero quaerat
                  sapiente voluptas reiciendis quas doloremque, repellat vero illo a perspiciatis. Doloremque
                  laudantium sed dolorem pariatur? Placeat, vero eaque?
                </p>
              </div>
              <div className="chat-list-item">
                <div className="item-header">
                  <p className="bulit">
                    <span className="chat"></span>
                  </p>
                  <p className="user-photo">
                    OR <span className="online"></span>
                  </p>
                  <dl className="user-name">
                    <dt>Rosalee Melvin</dt>
                    <dd>@rosalee</dd>
                  </dl>
                  <p className="time">5min ago</p>
                </div>
                <p className="last-chat">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore itaque libero quaerat
                  sapiente voluptas reiciendis quas doloremque, repellat vero illo a perspiciatis. Doloremque
                  laudantium sed dolorem pariatur? Placeat, vero eaque?
                </p>
              </div>
              <div className="chat-list-item">
                <div className="item-header">
                  <p className="bulit">{/* <span className="chat"></span> */}</p>
                  <p className="user-photo">
                    DP <span className="online"></span>
                  </p>
                  <dl className="user-name">
                    <dt>Rosalee Melvin</dt>
                    <dd>danny@datamarketing.co.kr</dd>
                  </dl>
                  <p className="time">5min ago</p>
                </div>
                <p className="last-chat">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore itaque libero quaerat
                  sapiente voluptas reiciendis quas doloremque, repellat vero illo a perspiciatis. Doloremque
                  laudantium sed dolorem pariatur? Placeat, vero eaque?
                </p>
              </div>
              <div className="chat-list-item">
                <div className="item-header">
                  <p className="bulit">{/* <span className="chat"></span> */}</p>
                  <p className="user-photo">
                    TK <span className="online"></span>
                  </p>
                  <dl className="user-name">
                    <dt>Theo Kim</dt>
                    <dd>@mobile</dd>
                  </dl>
                  <p className="time">5min ago</p>
                </div>
                <p className="last-chat">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore itaque libero quaerat
                  sapiente voluptas reiciendis quas doloremque, repellat vero illo a perspiciatis. Doloremque
                  laudantium sed dolorem pariatur? Placeat, vero eaque?
                </p>
              </div>
              <div className="chat-list-item">
                <div className="item-header">
                  <p className="bulit">{/* <span className="chat"></span> */}</p>
                  <p className="user-photo">
                    OR <span className="online"></span>
                  </p>
                  <dl className="user-name">
                    <dt>Rosalee Melvin</dt>
                    <dd>@rosalee</dd>
                  </dl>
                  <p className="time">5min ago</p>
                </div>
                <p className="last-chat">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore itaque libero quaerat
                  sapiente voluptas reiciendis quas doloremque, repellat vero illo a perspiciatis. Doloremque
                  laudantium sed dolorem pariatur? Placeat, vero eaque?
                </p>
              </div>
              <div className="chat-list-item">
                <div className="item-header">
                  <p className="bulit">{/* <span className="chat"></span> */}</p>
                  <p className="user-photo">
                    DP <span className="online"></span>
                  </p>
                  <dl className="user-name">
                    <dt>Rosalee Melvin</dt>
                    <dd>danny@datamarketing.co.kr</dd>
                  </dl>
                  <p className="time">5min ago</p>
                </div>
                <p className="last-chat">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore itaque libero quaerat
                  sapiente voluptas reiciendis quas doloremque, repellat vero illo a perspiciatis. Doloremque
                  laudantium sed dolorem pariatur? Placeat, vero eaque?
                </p>
              </div>
            </div>
          </div>
          <div className="messenger-body">
            <div className="chat-box-header">
              <div className="user-info">
                <p className="photo">OR</p>
                <dl className="name">
                  <dt>
                    Rosalee Melvin <span className="online">Online</span>
                  </dt>
                  <dd>bilbo@datamarketing.co.kr</dd>
                </dl>
              </div>
              <div className="chat-menu">
                <button onClick={handleClick1}>
                  <img src="/image/ico-users-plus.svg" alt="add user" />
                </button>
                <button className="btn-more" onClick={handleClick2}>
                  <img src="/image/ico-dot-menu.svg" alt="more" />
                </button>
                <Menu
                  anchorEl={anchorEl1}
                  open={Boolean(anchorEl1)}
                  onClose={handleClose1}
                  PaperProps={{
                    className: 'sub-menu member-menu',
                  }}
                >
                  <Typography variant="h6" className="text">
                    Members(3)
                  </Typography>
                  <Divider className="!mb-5" />
                  <MenuItem>
                    <p className="name">DP</p>
                    <dl className="email">
                      <dt>danny@datamarketing.co.kr</dt>
                    </dl>
                    <button>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <p className="name">DP</p>
                    <dl className="email">
                      <dt>Bilbo Han@datamarketing.co.krdatamarketing</dt>
                      <dd>YOU</dd>
                    </dl>
                    <button>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <p className="name">DP</p>
                    <dl className="email">
                      <dt>danny@datamarketing.co.kr</dt>
                    </dl>
                    <button>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </MenuItem>
                  <Divider className="!mb-5 !mt-5" />
                  <Typography variant="body1">
                    <button
                      className="flex h-40 w-full items-center justify-start gap-5 px-20 text-sm text-default-700 hover:bg-default-100"
                      onClick={() => handleOpen('AddPeople')}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      Add another account
                    </button>
                  </Typography>
                </Menu>
                <Menu
                  anchorEl={anchorEl2}
                  open={Boolean(anchorEl2)}
                  onClose={handleClose2}
                  PaperProps={{
                    className: 'sub-menu',
                  }}
                >
                  <Typography variant="h6" className="text">
                    Options
                  </Typography>
                  <Divider />
                  <MenuItem onClick={() => {}}>
                    <img src="/image/ico-download.svg" alt="" />
                    Leave
                  </MenuItem>
                  <MenuItem onClick={() => {}} className="item-red">
                    <img src="/image/ico-trash-r.svg" alt="" />
                    Delete
                  </MenuItem>
                </Menu>
              </div>
            </div>
            <div className="chat-box-body">
              <div className="chating-list">
                <div className="chating-item">
                  <p className="photo">
                    OR <span className="online"></span>
                  </p>
                  <div className="msg-box">
                    <dl className="msg-info">
                      <dt>Billbo Han</dt>
                      <dd>Thursday 11:40am</dd>
                    </dl>
                    <div className="msg">
                      Hey Olivia, I ve finished with the requirements doc! I made some notes in the gdoc as well
                      for Phoenix to look over.
                    </div>
                  </div>
                </div>
                <div className="chating-item">
                  <p className="photo">
                    OR <span className="online"></span>
                  </p>
                  <div className="msg-box">
                    <dl className="msg-info">
                      <dt>Billbo Han</dt>
                      <dd>Thursday 11:40am</dd>
                    </dl>
                    <div className="msg">Hey Olivia, I ve finished with the requirements</div>
                  </div>
                </div>
                <div className="chating-item">
                  <p className="photo">
                    OR <span className="online"></span>
                  </p>
                  <div className="msg-box">
                    <dl className="msg-info">
                      <dt>Billbo Han</dt>
                      <dd>Thursday 11:40am</dd>
                    </dl>
                    <div className="msg">
                      <a href="#" className="file-add">
                        <img src="/image/ico-file-csv.png" alt="file" />
                        <dl>
                          <dt>requirements.csv</dt>
                          <dd>1.2MB</dd>
                        </dl>
                      </a>
                    </div>
                  </div>
                </div>
                <div className="chating-item me">
                  <div className="msg-box">
                    <dl className="msg-info">
                      <dt>You</dt>
                      <dd>Thursday 11:40am</dd>
                    </dl>
                    <div className="msg">Awesome! Thanks. I ll look at this today.</div>
                  </div>
                </div>
                <div className="chating-item">
                  <p className="photo">
                    OR <span className="online"></span>
                  </p>
                  <div className="msg-box">
                    <dl className="msg-info">
                      <dt>Billbo Han</dt>
                      <dd>Thursday 11:40am</dd>
                    </dl>
                    <div className="msg">No rush though — we still have to wait for Lana s designs.</div>
                  </div>
                </div>
                {/* 날짜 구분 */}
                <div className="date-line">
                  <p>Today</p>
                </div>
                {/* 날짜 구분 */}
                <div className="chating-item">
                  <p className="photo">
                    OR <span className="online"></span>
                  </p>
                  <div className="msg-box">
                    <dl className="msg-info">
                      <dt>Billbo Han</dt>
                      <dd>Thursday 11:40am</dd>
                    </dl>
                    <div className="msg">Hey Olivia, can you please review the latest design when you can?</div>
                  </div>
                </div>
                <div className="chating-item me">
                  <div className="msg-box">
                    <dl className="msg-info">
                      <dt>You</dt>
                      <dd>Thursday 11:40am</dd>
                    </dl>
                    <div className="msg">Sure thing, I ll have a look today. They re looking great!</div>
                    <p className="emoji">👍 ❤️ 👌</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="chat-box-footer">
              <div className="chat-block">
                <Input
                  type="text"
                  placeholder="Type a message"
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                />
                <div className="mt-auto flex items-center gap-2">
                  <button>
                    <img src="/image/ico-smile.svg" alt="smile" />
                  </button>
                  <button>
                    <img src="/image/ico-clip.svg" alt="file" />
                  </button>
                  <button className="btn-send">Send</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <AddPeople open={openPopups.AddPeople} onClose={createCloseHandler('AddPeople')} />
    </>
  );
};

export default MessengerPage;
