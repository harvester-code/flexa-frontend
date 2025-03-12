import { useState } from 'react';
import { faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@/lib/utils';
import styles from './HomeAccordion.module.css';

interface HomeAccordionProps {
  title: string;
  open?: boolean;
  children?: React.ReactNode;
}

function HomeAccordion({ title, open = true, children }: HomeAccordionProps) {
  const [isOpened, setIsOpened] = useState<boolean>(open);

  return (
    <div className={styles.slideContainer}>
      <div className={styles.slideHead}>
        <h3
          className={cn(styles.slideTitle, isOpened ? '' : styles.hide)}
          onClick={() => setIsOpened(!isOpened)}
        >
          <span>{title}</span>
          <FontAwesomeIcon className="icon-lg" icon={faAngleUp} />
        </h3>
      </div>

      <div className={cn(styles.slideContents, isOpened ? '' : styles.hide)}>{children}</div>
    </div>
  );
}

export default HomeAccordion;
