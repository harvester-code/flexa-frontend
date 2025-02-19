import { RefObject, useCallback, useEffect, useState } from "react"

export const useResize = (myRef: RefObject<HTMLElement | null>) => {
  const [width, setWidth] = useState<number>(0)
  const [height, setHeight] = useState<number>(0)
  
  const handleResize = useCallback(() => {
    if(myRef.current) {
      setWidth(myRef.current.offsetWidth)
      setHeight(myRef.current.offsetHeight)
    }
  }, [myRef?.current])

  useEffect(() => {
    window.addEventListener('load', handleResize);
    window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      window.removeEventListener('load', handleResize);
      window.removeEventListener('resize', handleResize);
    }
  }, [myRef?.current, handleResize])

  return { width, height }
}