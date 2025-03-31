import Image from 'next/image';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useFacilityDetails } from '@/queries/homeQueries';
import { cn } from '@/lib/utils';
// TODO: CSS 모듈화하기
import './HomeDetails.css';

interface HomeDetailsProps {
  scenario: any;
}

function HomeDetails({ scenario }: HomeDetailsProps) {
  // FIXME: 병하대리님께 재수정 요청
  const { data: { data: details } = [] } = useFacilityDetails({
    calculate_type: 'mean', // TODO: 아래 값은 Summary에서 받아와야한다.
    percentile: 0,
    //
    scenarioId: scenario?.id,
  });

  // TODO: 기준 정해서 색깔 적용하기
  return (
    <div className="detail-list">
      {details &&
        details.map(({ category, overview, components }, i) => (
          <div className="detail-item" key={i}>
            <div className="detail-head">
              <h4>{category}</h4>
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
                    <dd>
                      {overview.opened[0]} / {overview.opened[1]}
                    </dd>
                  </dl>
                </div>

                <div>
                  <Image src="/image/ico-main-02.svg" width={30} height={30} alt="" />
                  <dl>
                    <dt>Throughput</dt>
                    <dd>{overview.throughput}</dd>
                  </dl>
                </div>

                <div>
                  <Image src="/image/ico-main-03.svg" width={30} height={30} alt="" />
                  <dl>
                    <dt>Max Queue</dt>
                    <dd>{overview.maxQueue}</dd>
                  </dl>
                </div>

                <div>
                  <Image src="/image/ico-main-03.svg" width={30} height={30} alt="" />
                  <dl>
                    <dt>Queue Length</dt>
                    <dd>{overview.queueLength}</dd>
                  </dl>
                </div>
                <div>
                  <Image src="/image/ico-main-04.svg" width={30} height={30} alt="" />
                  <dl>
                    <dt>Proc. Time</dt>
                    <dd>{overview.procTime}</dd>
                  </dl>
                </div>
                <div>
                  <Image src="/image/ico-main-04-1.svg" width={30} height={30} alt="" />
                  <dl>
                    <dt>Waiting Time</dt>
                    <dd>{overview.waitTime}</dd>
                  </dl>
                </div>
              </div>

              <div className="scroll-list">
                {components.map((comp, j) => (
                  <div className={cn('scroll-item', !comp.isOpened && 'closed')} key={j}>
                    <div className="scroll-item-head">
                      <h5>
                        <em>{comp.title}</em>
                        {!comp.isOpened && <span className="stats-close">CLOSED</span>}
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
                            <dd>
                              {comp.opened[0]} / {comp.opened[1]}
                            </dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-02.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Throughput</dt>
                            <dd>{comp.throughput}</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Max Queue</dt>
                            <dd>{comp.maxQueue}</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-03.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Queue Length</dt>
                            <dd>{comp.queueLength}</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Proc. Time</dt>
                            <dd>{comp.procTime}</dd>
                          </dl>
                        </div>
                        <div>
                          <Image src="/image/ico-main-04-1.svg" alt="" width={24} height={24} />
                          <dl>
                            <dt>Waiting Time</dt>
                            <dd>{comp.waitTime}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

export default HomeDetails;
