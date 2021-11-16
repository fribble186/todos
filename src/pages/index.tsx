import React, { useState, useEffect } from 'react';
import styles from './index.less';
import { Input, Form } from 'antd';
import { createFromIconfontCN } from '@ant-design/icons';
import rough from 'roughjs';
import moment from 'moment';
import { useHistory } from 'umi';
import type { Options } from 'roughjs/bin/core';

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_2938743_vkdbbq13v9.js',
});

export interface ITodoItem {
  id: string;
  content: string;
  endTime: string;
  doneTime?: string;
}

export interface ITodo {
  data?: ITodoItem[];
}

declare const DurationType: 'day' | 'week' | 'month' | 'year';

// const todos: ITodoItem[] = [
//   {
//     content: 'test1',
//     endTime: '2021-11-15',
//   },
//   {
//     content: 'test2',
//     endTime: '2021-11-15',
//   },
//   {
//     content: 'test3',
//     endTime: '2021-11-15',
//   },
// ];

export default function IndexPage() {
  const history = useHistory();
  /**
   * 通过 proxy 监听 localstorage 的 set 事件
   * 如果有 set 事件则 手动触发刷新
   */
  const [_, refreshState] = useState<number>();
  const refresh = () => refreshState(() => Math.random());
  const STORAGE = window.localStorage;
  const TODOStr = STORAGE.getItem('TODO');
  let OriginTODO: ITodo = {};
  try {
    if (TODOStr !== null) {
      OriginTODO = JSON.parse(TODOStr);
    }
  } catch (e) {
    STORAGE.setItem('TODO', '{}');
  }
  const TODO = new Proxy(OriginTODO, {
    set: function (obj, prop, value) {
      if (prop === 'data') obj[prop] = value;
      STORAGE.setItem('TODO', JSON.stringify(obj));
      refresh();
      return true;
    },
  });

  const [currentDuration, setCurrentDuration] =
    useState<typeof DurationType>('day');
  const [deadline, setDeadline] = useState<string>('');
  const filterTodoDataByDuration = (TODO?.data?.filter((todo) => {
    switch (currentDuration) {
      case 'day':
        // 今天到明天
        return (
          moment(todo.endTime).isBefore(
            moment().format('YYYY-MM-DD 24:00:00'),
          ) &&
          moment(todo.endTime).isAfter(moment().format('YYYY-MM-DD 00:00:00'))
        );
      case 'week':
        // 今天到这周日
        return (
          moment(todo.endTime).isAfter(
            moment().format('YYYY-MM-DD 00:00:00'),
          ) &&
          moment(todo.endTime).isBefore(
            moment().weekday(7).format('YYYY-MM-DD 24:00:00'),
          )
        );
      case 'month':
        // 今天到月底
        return (
          moment(todo.endTime).isAfter(
            moment().format('YYYY-MM-DD 00:00:00'),
          ) &&
          moment(todo.endTime).isBefore(
            moment().endOf('month').format('YYYY-MM-DD 24:00:00'),
          )
        );
      case 'year':
        // 今天到年底
        return (
          moment(todo.endTime).isAfter(
            moment().format('YYYY-MM-DD 00:00:00'),
          ) &&
          moment(todo.endTime).isBefore(
            moment().endOf('year').format('YYYY-MM-DD 24:00:00'),
          )
        );
    }
  }) || []) as ITodoItem[];
  useEffect(() => {
    switch (currentDuration) {
      case 'day':
        setDeadline(moment().format('YYYY-MM-DD 23:59:59'));
        break;
      case 'week':
        setDeadline(moment().weekday(7).format('YYYY-MM-DD 23:59:59'));
        break;
      case 'month':
        setDeadline(moment().endOf('month').format('YYYY-MM-DD 23:59:59'));
        break;
      case 'year':
        setDeadline(moment().endOf('year').format('YYYY-MM-DD 23:59:59'));
        break;
    }
  }, [currentDuration]);

  const [inputVal, setInputVal] = useState<string>('');

  const handleUnDoneTodo = (doneTodo: ITodoItem) => {
    const todoData = TODO?.data || [];
    todoData[todoData.findIndex((todo) => todo.id === doneTodo.id)].doneTime =
      undefined;
    TODO.data = todoData;
  };

  const handleDoneTodo = (doneTodo: ITodoItem) => {
    const todoData = TODO?.data || [];
    todoData[todoData.findIndex((todo) => todo.id === doneTodo.id)].doneTime =
      moment().format('YYYY-MM-DD hh:mm:ss');
    TODO.data = todoData;
  };

  const handleDeleteTodo = (deleteTodo: ITodoItem) => {
    const todoData = TODO?.data || [];
    todoData.splice(
      todoData.findIndex((todo) => todo.id === deleteTodo.id),
      1,
    );
    TODO.data = todoData;
  };

  const handleAddTodo = () => {
    const todoData = TODO?.data || [];
    todoData.push({
      id: String(Math.max(...todoData.map((todo) => Number(todo.id))) + 1),
      content: inputVal,
      endTime: deadline,
    });
    TODO.data = todoData;
    setInputVal('');
  };

  /**
   * 通过 roughjs 生成手绘风格的形状
   * @param ref 实例
   * @param type 形状
   * @param options 选项，透传到 roughjs 中 https://roughjs.com/
   */
  const generateRoughSvg = (
    ref: SVGSVGElement | null,
    type: 'rect' | 'hugeBtn' | 'smallBtn' | 'radio' | 'input' | 'inputLine',
    options?: Options,
  ) => {
    if (ref) {
      if (ref.childNodes.length) ref.removeChild(ref.childNodes[0]);
      const rs = rough.svg(ref);
      let node: SVGGElement | undefined;
      switch (type) {
        case 'rect':
          node = rs.rectangle(2, 2, 35, 35, options);
          break;
        case 'hugeBtn':
          node = rs.rectangle(2, 2, 100, 35, options);
          break;
        case 'smallBtn':
          node = rs.rectangle(2, 2, 60, 26, options);
          break;
        case 'radio':
          node = rs.circle(20, 20, 20, options);
          break;
        case 'input':
          node = rs.rectangle(2, 2, 500, 35);
          break;
        case 'inputLine':
          node = rs.line(0, 30, 500, 30);
          break;
      }
      if (node) {
        ref.appendChild(node);
      } else {
        throw Error('NOT DEFINE TYPE');
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pcHeadContainer}>
        <div className={styles.durationSelector}>
          {(
            [
              { key: 'day', value: '天' },
              { key: 'week', value: '周' },
              { key: 'month', value: '月' },
              { key: 'year', value: '年' },
            ] as { key: typeof DurationType; value: string }[]
          ).map(({ key, value }) => (
            <div
              key={`duration_${key}`}
              className={styles.durationSelectorItem}
              onClick={() => currentDuration !== key && setCurrentDuration(key)}
            >
              <svg
                ref={(ref) =>
                  generateRoughSvg(
                    ref,
                    'rect',
                    currentDuration === key
                      ? { fill: 'black', fillStyle: 'solid' }
                      : {},
                  )
                }
              />
              <span
                style={
                  currentDuration === key
                    ? { position: 'absolute', color: 'white' }
                    : {}
                }
              >
                {value}
              </span>
            </div>
          ))}
        </div>
        {/* <div className={styles.userIcon}>
          <svg ref={drawTitleBack} id="back" />
          <div>无聊的日记本</div>
        </div> */}
      </div>

      <div>
        <span>DEADLINE: {deadline}</span>
      </div>

      <div className={styles.todoAddContainer}>
        <div className={styles.diary} onClick={() => history.push('/diary')}>
          <IconFont type="icon-shubenbijiben" />
          <span>查看日记</span>
        </div>
        <div className={styles.inputContainer}>
          <svg ref={(ref) => generateRoughSvg(ref, 'input')} />
          <Input
            value={inputVal}
            bordered={false}
            onPressEnter={handleAddTodo}
            onChange={(e) => setInputVal(e.target.value)}
          />
        </div>
        <div className={styles.hugeBtn} onClick={handleAddTodo}>
          <svg
            ref={(ref) =>
              generateRoughSvg(ref, 'hugeBtn', {
                fill: 'black',
                fillStyle: 'solid',
              })
            }
          />
          <span>记一笔</span>
        </div>
      </div>

      {filterTodoDataByDuration.map((todo, todoIndex) => (
        <div key={`todo${todoIndex}`} className={styles.todoItemContainer}>
          {todo.doneTime ? (
            <IconFont
              type="icon-xuanzhong"
              className={styles.selected}
              onClick={() => handleUnDoneTodo(todo)}
            />
          ) : (
            <svg
              ref={(ref) => generateRoughSvg(ref, 'radio')}
              onClick={() => handleDoneTodo(todo)}
              className={styles.unselected}
            />
          )}
          <div className={styles.inputContainer}>
            {todo.doneTime ? null : (
              <svg ref={(ref) => generateRoughSvg(ref, 'inputLine')} />
            )}
            <Input
              bordered={false}
              value={todo.content}
              style={todo.doneTime ? { textDecoration: 'line-through' } : {}}
            />
          </div>
          {todo.doneTime ? null : (
            <>
              <div className={styles.smallBtn}>
                <svg ref={(ref) => generateRoughSvg(ref, 'smallBtn')} />
                <span>编辑</span>
              </div>
              <div
                className={styles.smallBtn}
                onClick={() => handleDeleteTodo(todo)}
              >
                <svg ref={(ref) => generateRoughSvg(ref, 'smallBtn')} />
                <span>删除</span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
