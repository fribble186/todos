import React from 'react';
import moment from 'moment';
import type { ITodo, ITodoItem } from '../index';

const EMPTYWORD = '这一生一事无成又怎样';

const Diary = () => {
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
  return (
    <div>
      {doneTodo.length ? (
        <div>
          <h2>我的日记</h2>
          <br />
          <br />
          <p>我今天干了{` ${doneTodo.length} `}件事情</p>
          <br />
        </div>
      ) : (
        <h1>{EMPTYWORD}</h1>
      )}
    </div>
  );
};

export default Diary;
