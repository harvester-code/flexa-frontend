import Image from 'next/image';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// TODO: CSS 모듈화하기
import './HomeDetails.css';

function HomeDetails() {
  return (
    <>
      <div className="detail-list">
        <div className="detail-item">
          <div className="detail-head">
            <h4>Check-In</h4>
            <a href="#">
              <span>Details</span>
              <FontAwesomeIcon style={{ fontSize: '14px' }} icon={faArrowRight} />
            </a>
          </div>

          <div className="detail-body">
            <div className="summary">
              <div>
                <Image src="/image/ico-main-01.svg" width={30} height={30} alt="" />
                <dl>
                  <dt>Opened</dt>
                  <dd>352 / 486</dd>
                </dl>
              </div>
              <div>
                <Image src="/image/ico-main-02.svg" width={30} height={30} alt="" />
                <dl>
                  <dt>Throughput</dt>
                  <dd>500</dd>
                </dl>
              </div>
              <div>
                <Image src="/image/ico-main-03.svg" width={30} height={30} alt="" />
                <dl>
                  <dt>Max Queue</dt>
                  <dd>500</dd>
                </dl>
              </div>
              <div>
                <Image src="/image/ico-main-03.svg" width={30} height={30} alt="" />
                <dl>
                  <dt>Queue Length</dt>
                  <dd>135</dd>
                </dl>
              </div>
              <div>
                <Image src="/image/ico-main-04.svg" width={30} height={30} alt="" />
                <dl>
                  <dt>Proc. Time</dt>
                  <dd>00:00:11</dd>
                </dl>
              </div>
              <div>
                <Image src="/image/ico-main-04-1.svg" width={30} height={30} alt="" />
                <dl>
                  <dt>Waiting Time</dt>
                  <dd>00:12:29</dd>
                </dl>
              </div>
            </div>

            <div className="scroll-list">
              <div className="scroll-item closed">
                <div className="scroll-item-head">
                  <h5>
                    <em>A</em>
                    <span className="stats-close">CLOSED</span>
                  </h5>
                  <a href="#">
                    <span>Details</span>
                    <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                  </a>
                </div>

                <div className="scroll-item-body">
                  <div className="summary-sm disabled">
                    <div>
                      <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Opened</dt>
                        <dd>0 / 2</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Throughput</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Max Queue</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Queue Length</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Proc. Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Waiting Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="scroll-item">
                <div className="scroll-item-head">
                  <h5>
                    <em>B</em> <span className="stats-close">CLOSED</span>
                  </h5>
                  <a href="#">
                    Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                  </a>
                </div>
                <div className="scroll-item-body">
                  <div className="summary-sm">
                    <div>
                      <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Opened</dt>
                        <dd>0 / 2</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Throughput</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Max Queue</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Queue Length</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Proc. Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Waiting Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="scroll-item">
                <div className="scroll-item-head">
                  <h5>
                    <em>C</em> <span className="stats-close">CLOSED</span>
                  </h5>
                  <a href="#">
                    Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                  </a>
                </div>
                <div className="scroll-item-body">
                  <div className="summary-sm">
                    <div>
                      <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Opened</dt>
                        <dd>0 / 2</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Throughput</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Max Queue</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Queue Length</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Proc. Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Waiting Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="scroll-item">
                <div className="scroll-item-head">
                  <h5>
                    <em>D</em> <span className="stats-close">CLOSED</span>
                  </h5>
                  <a href="#">
                    Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                  </a>
                </div>
                <div className="scroll-item-body">
                  <div className="summary-sm">
                    <div>
                      <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Opened</dt>
                        <dd>0 / 2</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Throughput</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Max Queue</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Queue Length</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Proc. Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Waiting Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="scroll-item">
                <div className="scroll-item-head">
                  <h5>
                    <em>E</em> <span className="stats-close">CLOSED</span>
                  </h5>
                  <a href="#">
                    Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                  </a>
                </div>
                <div className="scroll-item-body">
                  <div className="summary-sm">
                    <div>
                      <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Opened</dt>
                        <dd>0 / 2</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Throughput</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Max Queue</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Queue Length</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Proc. Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Waiting Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="scroll-item">
                <div className="scroll-item-head">
                  <h5>
                    <em>F</em> <span className="stats-close">CLOSED</span>
                  </h5>
                  <a href="#">
                    Details <FontAwesomeIcon style={{ fontSize: '10px' }} icon={faArrowRight} />
                  </a>
                </div>
                <div className="scroll-item-body">
                  <div className="summary-sm">
                    <div>
                      <Image src="/image/ico-main-01.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Opened</dt>
                        <dd>0 / 2</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Throughput</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Max Queue</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Queue Length</dt>
                        <dd>0</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Proc. Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                    <div>
                      <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                      <dl>
                        <dt>Waiting Time</dt>
                        <dd>00:00:00</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomeDetails;
