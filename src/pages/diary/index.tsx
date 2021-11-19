import React, { useState, useCallback, useEffect } from 'react';
import moment from 'moment';
import type { ITodo, ITodoItem } from '../index';
import styles from './index.less';
import rough from 'roughjs';

const WEBWIDTH = 800;
const EMPTYWORD = '这一生一事无成又怎样，为何要功成名就才伟大。';

const Diary = () => {
  const [isWeb, setIsWeb] = useState(
    document.documentElement.clientWidth > WEBWIDTH,
  );

  const onResize = useCallback(() => {
    setIsWeb(document.documentElement.clientWidth > WEBWIDTH);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  });

  let TODO: ITodo = {};
  try {
    const storageTodo = window.localStorage.getItem('TODO');
    if (storageTodo) {
      TODO = JSON.parse(storageTodo) as ITodo;
    }
  } catch (e) {}
  const todayTodo =
    TODO?.data?.filter(
      (todo) =>
        moment(todo.endTime).isBefore(moment().format('YYYY-MM-DD 24:00:00')) &&
        moment(todo.endTime).isAfter(moment().format('YYYY-MM-DD 00:00:00')),
    ) || ([] as ITodoItem[]);
  const doneTodo = todayTodo.filter((todo) => todo.doneTime);
  const unDoneTodo = todayTodo.filter((todo) => !todo.doneTime);

  const getDoneTxt = () => {
    if (doneTodo.length === 0) {
      return '';
    } else if (doneTodo.length === 1) {
      return `完成了“${doneTodo[0].content}”。`;
    } else if (doneTodo.length === 2) {
      return `完成了“${doneTodo[0].content}”，还完成了“${doneTodo[1].content}”。`;
    } else if (doneTodo.length === 3) {
      const firstTodo = doneTodo[0];
      const lastTodo = doneTodo[doneTodo.length - 1];
      const otherTodos = doneTodo.slice(1, doneTodo.length - 1);
      return `完成了“${firstTodo.content}”，${otherTodos.map(
        (todo) => `还完成了“${doneTodo[1].content}”，`,
      )}最后还完成了“${lastTodo.content}”。`;
    }
  };

  const drawCardRect = (ref: SVGSVGElement) => {
    if (ref) {
      const rs = rough.svg(ref);
      const node = rs.rectangle(2, 2, 800, 400);
      ref.appendChild(node);
    }
  };

  const drawMobileCardRect = (ref: SVGSVGElement) => {
    if (ref) {
      const rs = rough.svg(ref);
      const node = rs.rectangle(2, 2, 300, 600);
      ref.appendChild(node);
    }
  };

  return isWeb ? (
    <div className={styles.pageContainer}>
      <div className={styles.diaryCard}>
        <svg ref={drawCardRect} />
        <div className={styles.content}>
          {doneTodo.length ? (
            <div>
              <h2>我的日记</h2>
              <br />
              <br />
              <p>我今天干了{` ${doneTodo.length} `}件事情！</p>
              <br />
              <p>{getDoneTxt()}</p>
              <br />
              {unDoneTodo.length ? (
                <p>
                  但是我还没完成
                  {unDoneTodo.map((todo) => `“${todo.content}”，`)}
                  要不还是明天完成吧！
                </p>
              ) : null}
              {unDoneTodo.length ? (
                <p>今天早点睡觉吧，别玩手机了！</p>
              ) : (
                <p>今天任务都做完了，睡觉去咯！</p>
              )}
              <div className={styles.timestamp}>
                {moment().format('YYYY-MM-DD')}
              </div>
            </div>
          ) : (
            <h1>{EMPTYWORD}</h1>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className={styles.pageContainer}>
      <div className={styles.mobileDiaryCard}>
        <svg ref={drawMobileCardRect} />
        <div className={styles.content}>
          {doneTodo.length ? (
            <div>
              <h2>我的日记</h2>
              <br />
              <br />
              <p>我今天干了{` ${doneTodo.length} `}件事情！</p>
              <br />
              <p>{getDoneTxt()}</p>
              <br />
              <p>
                但是我还没完成{unDoneTodo.map((todo) => `“${todo.content}”，`)}
                要不还是明天完成吧！
              </p>
              <p>今天早点睡觉吧，别玩手机了！</p>
              <div className={styles.timestamp}>
                {moment().format('YYYY-MM-DD')}
              </div>
            </div>
          ) : (
            <h1>{EMPTYWORD}</h1>
          )}
        </div>
      </div>
    </div>
  );
};

export default Diary;
