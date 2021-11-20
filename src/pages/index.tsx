import React, { useState, useEffect, useCallback } from 'react';
import styles from './index.less';
import { Input, Modal, message } from 'antd';
import { createFromIconfontCN } from '@ant-design/icons';
import rough from 'roughjs';
import moment from 'moment';
import { useHistory, useRequest } from 'umi';
import type { Options } from 'roughjs/bin/core';
import request from 'umi-request';

const WEBWIDTH = 800;

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_2938743_vkdbbq13v9.js',
});

export interface ITodoItem {
  id: string;
  content: string;
  endTime: string;
  doneTime?: string;
  status?: 'ADD' | 'DELETE' | 'CHANGE';
  isDelete?: boolean;
}

export interface ITodo {
  data?: ITodoItem[];
}

declare const DurationType: 'day' | 'week' | 'month' | 'year';

export default function IndexPage() {
  const history = useHistory();

  /**
   * 登录用到的变量
   */
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginVerifyCode, setLoginVerifyCode] = useState<string>('');
  const [hasSendVerify, setHasSendVerify] = useState<boolean>(false);

  /**
   * 同步的请求
   */
  const {
    data: syncTodoData,
    run,
    loading,
    error,
  } = useRequest(
    (params) => request.post('https://api.fribble186.cn/api/todo/sync', params),
    {
      debounceInterval: 2000,
      manual: true,
    },
  );
  useEffect(() => {
    // 监听同步请求的 response data 并赋值到页面的 TODO，触发 proxy
    if (syncTodoData) {
      TODO.data = JSON.parse(syncTodoData).data;
    }
  }, [syncTodoData]);

  /**
   * 获取验证码
   */
  const getVerifyCode = async () => {
    if (hasSendVerify) {
      message.error('是不是点的过于频繁了🤔');
      return;
    }
    await request.post('https://api.fribble186.cn/api/verify/sendVerify', {
      data: { email: loginEmail },
    });
    message.success('发送啦，注意查收邮箱😀');
    setHasSendVerify(true);
    setTimeout(() => setHasSendVerify(false), 60 * 1000);
  };

  /**
   * 登录的逻辑
   */
  const login = async () => {
    const response = await request.post(
      'https://api.fribble186.cn/api/user/login',
      {
        data: { email: loginEmail, code: loginVerifyCode },
      },
    );
    if (response.success) {
      setShowLoginModal(false);
      window.localStorage.setItem('TODO-EMAIL', loginEmail);
      setLoginEmail('');
      setLoginVerifyCode('');
      run({ data: { data: { data: [] }, email: loginEmail } });
    } else {
      message.error(response.message || '出错了');
    }
  };

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
      if (!(OriginTODO.data instanceof Array)) {
        OriginTODO = {};
        STORAGE.setItem('TODO', '{}');
      }
    }
  } catch (e) {
    STORAGE.setItem('TODO', '{}');
  }
  const TODO = new Proxy(OriginTODO, {
    set: function (obj, prop, value) {
      if (prop === 'data') {
        obj[prop] = value;
        STORAGE.setItem('TODO', JSON.stringify(obj));
        const email = window.localStorage.getItem('TODO-EMAIL');
        if (email && JSON.stringify({ data: value }) !== syncTodoData) {
          run({ data: { data: { data: value }, email } });
        }
        refresh();
      }
      return true;
    },
  });

  /**
   * 监听是手机还是 web
   */
  const [isWeb, setIsWeb] = useState(
    document.documentElement.clientWidth > WEBWIDTH,
  );
  const onResize = useCallback(() => {
    setIsWeb(document.documentElement.clientWidth > WEBWIDTH);
  }, []);
  useEffect(() => {
    window.addEventListener('resize', onResize);
    const email = window.localStorage.getItem('TODO-EMAIL');
    if (email) {
      run({ data: { data: { data: [] }, email } });
    }
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  /**
   * 监听 天 周 月 年 并过滤出相应的 todo list 和 deadline
   */
  const [currentDuration, setCurrentDuration] =
    useState<typeof DurationType>('day');
  const [deadline, setDeadline] = useState<string>('');
  const _data = TODO?.data ? TODO.data.slice() : [];
  const filterTodoDataByDuration = (_data
    //@ts-ignore
    ?.sort((a, b) => !b.doneTime - !a.doneTime)
    ?.filter((todo) => {
      if (todo.isDelete) {
        return false;
      }
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
          // 这周一这周日
          return (
            moment(todo.endTime).isAfter(
              moment().weekday(1).format('YYYY-MM-DD 00:00:00'),
            ) &&
            moment(todo.endTime).isBefore(
              moment().weekday(7).format('YYYY-MM-DD 24:00:00'),
            )
          );
        case 'month':
          // 月初到月底
          return (
            moment(todo.endTime).isAfter(
              moment().startOf('month').format('YYYY-MM-DD 00:00:00'),
            ) &&
            moment(todo.endTime).isBefore(
              moment().endOf('month').format('YYYY-MM-DD 24:00:00'),
            )
          );
        case 'year':
          // 今天到年底
          return (
            moment(todo.endTime).isAfter(
              moment().startOf('year').format('YYYY-MM-DD 00:00:00'),
            ) &&
            moment(todo.endTime).isBefore(
              moment().endOf('year').format('YYYY-MM-DD 24:00:00'),
            )
          );
      }
    }) || []) as ITodoItem[];
  console.log(TODO.data, filterTodoDataByDuration);
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

  /**
   * 输入框中的值
   */
  const [inputVal, setInputVal] = useState<string>('');

  // 对 TODO 的各种操作
  /**
   * 勾回 TODO
   */
  const handleUnDoneTodo = (doneTodo: ITodoItem) => {
    const todoData = TODO?.data || [];
    const changeTodoItem =
      todoData[todoData.findIndex((todo) => todo.id === doneTodo.id)];
    changeTodoItem.doneTime = undefined;
    changeTodoItem.status = 'CHANGE';
    TODO.data = todoData;
  };

  /**
   * 勾掉 TODO
   */
  const handleDoneTodo = (doneTodo: ITodoItem) => {
    const todoData = TODO?.data || [];
    const changeTodoItem =
      todoData[todoData.findIndex((todo) => todo.id === doneTodo.id)];
    changeTodoItem.doneTime = moment().format('YYYY-MM-DD hh:mm:ss');
    changeTodoItem.status = 'CHANGE';
    TODO.data = todoData;
  };

  /**
   * 删除 TODO
   */
  const handleDeleteTodo = (doneTodo: ITodoItem) => {
    const todoData = TODO?.data || [];
    const deleteTodoItem =
      todoData[todoData.findIndex((todo) => todo.id === doneTodo.id)];
    deleteTodoItem.status = 'DELETE';
    deleteTodoItem.isDelete = true;
    TODO.data = todoData;
  };

  /**
   * 增加 TODO
   */
  const handleAddTodo = () => {
    const todoData = TODO?.data || [];
    todoData.push({
      id: todoData.length
        ? String(Math.max(...todoData.map((todo) => Number(todo.id))) + 1)
        : '0',
      content: inputVal,
      endTime: deadline,
      status: 'ADD',
    });
    TODO.data = todoData;
    setInputVal('');
  };

  /**
   * 把任务放到今天做
   */
  const handleFreshTodo = (doneTodo: ITodoItem) => {
    const todoData = TODO?.data || [];
    const deleteTodoItem =
      todoData[todoData.findIndex((todo) => todo.id === doneTodo.id)];
    deleteTodoItem.endTime = moment().format('YYYY-MM-DD 23:59:59');
    deleteTodoItem.status = 'CHANGE';
    TODO.data = todoData;
  };

  /**
   * 通过 roughjs 生成手绘风格的形状
   * @param ref 实例
   * @param type 形状
   * @param options 选项，透传到 roughjs 中 https://roughjs.com/
   */
  const generateRoughSvg = (
    ref: SVGSVGElement | null,
    type:
      | 'rect'
      | 'hugeBtn'
      | 'smallBtn'
      | 'mobileSmallBtn'
      | 'radio'
      | 'input'
      | 'inputLine'
      | 'mobileInput'
      | 'mobileInputline'
      | 'syncLight'
      | 'LoginRect',
    options?: Options,
  ) => {
    if (ref) {
      if (ref.childNodes.length) ref.removeChild(ref.childNodes[0]);
      const rs = rough.svg(ref);
      let node: SVGGElement | undefined;
      switch (type) {
        case 'LoginRect':
          node = rs.rectangle(2, 2, 70, 35, options);
          break;
        case 'syncLight':
          node = rs.circle(6, 6, 12, options);
          break;
        case 'rect':
          node = rs.rectangle(2, 2, 35, 35, options);
          break;
        case 'hugeBtn':
          node = rs.rectangle(2, 2, 100, 35, options);
          break;
        case 'smallBtn':
          node = rs.rectangle(2, 2, 60, 26, options);
          break;
        case 'mobileSmallBtn':
          node = rs.rectangle(2, 2, 40, 16, options);
          break;
        case 'radio':
          node = rs.circle(20, 20, 20, options);
          break;
        case 'input':
          node = rs.rectangle(2, 2, 500, 35);
          break;
        case 'mobileInput':
          node = rs.rectangle(2, 2, 200, 25);
          break;
        case 'inputLine':
          node = rs.line(0, 30, 500, 30);
          break;
        case 'mobileInputline':
          node = rs.rectangle(2, 2, 200, 25);
          break;
      }
      if (node) {
        ref.appendChild(node);
      } else {
        throw Error('NOT DEFINE TYPE');
      }
    }
  };

  return isWeb ? (
    // 网页端
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
        <div
          className={styles.userIcon}
          onClick={() => setShowLoginModal(true)}
        >
          <svg
            ref={(ref) => generateRoughSvg(ref, 'LoginRect')}
            className={styles.border}
          />
          <IconFont type="icon--penguin" className={styles.icon} />
          <span>LOGIN</span>
        </div>
      </div>

      <div>
        <span>DEADLINE: {deadline}</span>
      </div>

      {window.localStorage.getItem('TODO-EMAIL') ? (
        <div className={styles.syncLight}>
          {loading ? (
            <>
              <svg
                ref={(ref) =>
                  generateRoughSvg(ref, 'syncLight', {
                    strokeWidth: 0,
                    fill: 'gray',
                    fillStyle: 'solid',
                  })
                }
              />
              <span>sync...</span>
            </>
          ) : error ? (
            <>
              <svg
                ref={(ref) =>
                  generateRoughSvg(ref, 'syncLight', {
                    strokeWidth: 0,
                    fill: 'red',
                    fillStyle: 'solid',
                  })
                }
              />
              <span>Synchronization FAIL</span>
            </>
          ) : (
            <>
              <svg
                ref={(ref) =>
                  generateRoughSvg(ref, 'syncLight', {
                    strokeWidth: 0,
                    fill: 'green',
                    fillStyle: 'solid',
                  })
                }
              />
              <span>Complete Synchronization</span>
            </>
          )}
        </div>
      ) : null}

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
              {currentDuration === 'day' ? null : (
                <div
                  className={styles.smallBtn}
                  onClick={() => handleFreshTodo(todo)}
                >
                  <svg ref={(ref) => generateRoughSvg(ref, 'smallBtn')} />
                  <span>今天</span>
                </div>
              )}
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

      <Modal
        visible={showLoginModal}
        title={<span>登录/注册</span>}
        onCancel={() => setShowLoginModal(false)}
        footer={null}
        width={600}
      >
        <div>
          <div
            className={styles.inputContainer}
            style={{ marginBottom: '18px' }}
          >
            <svg ref={(ref) => generateRoughSvg(ref, 'input')} />
            <Input
              bordered={false}
              placeholder="请输入邮箱"
              onChange={(e) => setLoginEmail(e.target.value)}
              value={loginEmail}
            />
          </div>
          <div
            className={styles.inputContainer}
            style={{ marginBottom: '18px' }}
          >
            <svg ref={(ref) => generateRoughSvg(ref, 'input')} />
            <Input
              bordered={false}
              placeholder="请输入验证码"
              onChange={(e) => setLoginVerifyCode(e.target.value)}
              value={loginVerifyCode}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <div className={styles.hugeBtn} onClick={() => getVerifyCode()}>
              <svg
                ref={(ref) =>
                  generateRoughSvg(ref, 'hugeBtn', {
                    fill: 'black',
                    fillStyle: 'solid',
                  })
                }
              />
              <span>验证码</span>
            </div>
            <div className={styles.hugeBtn} onClick={() => login()}>
              <svg
                ref={(ref) =>
                  generateRoughSvg(ref, 'hugeBtn', {
                    fill: 'black',
                    fillStyle: 'solid',
                  })
                }
              />
              <span>登录</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  ) : (
    // 手机端
    <div className={styles.mobilePage}>
      mobile
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
        <div
          className={styles.userIcon}
          onClick={() => setShowLoginModal(true)}
        >
          <svg
            ref={(ref) => generateRoughSvg(ref, 'LoginRect')}
            className={styles.border}
          />
          <IconFont type="icon--penguin" className={styles.icon} />
          <span>LOGIN</span>
        </div>
      </div>
      <div>
        <span>DEADLINE: {deadline}</span>
      </div>
      {window.localStorage.getItem('TODO-EMAIL') ? (
        <div className={styles.syncLight}>
          {loading ? (
            <>
              <svg
                ref={(ref) =>
                  generateRoughSvg(ref, 'syncLight', {
                    strokeWidth: 0,
                    fill: 'gray',
                    fillStyle: 'solid',
                  })
                }
              />
              <span>sync...</span>
            </>
          ) : error ? (
            <>
              <svg
                ref={(ref) =>
                  generateRoughSvg(ref, 'syncLight', {
                    strokeWidth: 0,
                    fill: 'red',
                    fillStyle: 'solid',
                  })
                }
              />
              <span>Synchronization FAIL</span>
            </>
          ) : (
            <>
              <svg
                ref={(ref) =>
                  generateRoughSvg(ref, 'syncLight', {
                    strokeWidth: 0,
                    fill: 'green',
                    fillStyle: 'solid',
                  })
                }
              />
              <span>Complete Synchronization</span>
            </>
          )}
        </div>
      ) : null}
      <div className={styles.mobileTodoAddContainer}>
        <div className={styles.diary} onClick={() => history.push('/diary')}>
          <IconFont type="icon-shubenbijiben" />
          <span>查看日记</span>
        </div>
        <div className={styles.mobileInputContainer}>
          <svg ref={(ref) => generateRoughSvg(ref, 'mobileInput')} />
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
        <div
          key={`todo${todoIndex}`}
          className={styles.mobileTodoItemContainer}
        >
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
          <div className={styles.mobileInputContainer}>
            {todo.doneTime ? null : (
              <svg ref={(ref) => generateRoughSvg(ref, 'mobileInputline')} />
            )}
            <Input
              bordered={false}
              value={todo.content}
              style={todo.doneTime ? { textDecoration: 'line-through' } : {}}
            />
          </div>
          {todo.doneTime ? null : (
            <>
              {currentDuration === 'day' ? null : (
                <div
                  className={styles.mobileSmallBtn}
                  onClick={() => handleFreshTodo(todo)}
                >
                  <svg ref={(ref) => generateRoughSvg(ref, 'mobileSmallBtn')} />
                  <span>今天</span>
                </div>
              )}
              <div
                className={styles.mobileSmallBtn}
                onClick={() => handleDeleteTodo(todo)}
              >
                <svg ref={(ref) => generateRoughSvg(ref, 'mobileSmallBtn')} />
                <span>删除</span>
              </div>
            </>
          )}
        </div>
      ))}
      <Modal
        visible={showLoginModal}
        title={<span>登录/注册</span>}
        onCancel={() => setShowLoginModal(false)}
        footer={null}
        width={300}
      >
        <div>
          <div
            className={styles.mobileInputContainer}
            style={{ marginBottom: '18px' }}
          >
            <svg ref={(ref) => generateRoughSvg(ref, 'mobileInput')} />
            <Input
              bordered={false}
              placeholder="请输入邮箱"
              onChange={(e) => setLoginEmail(e.target.value)}
              value={loginEmail}
            />
          </div>
          <div
            className={styles.mobileInputContainer}
            style={{ marginBottom: '18px' }}
          >
            <svg ref={(ref) => generateRoughSvg(ref, 'mobileInput')} />
            <Input
              bordered={false}
              placeholder="请输入验证码"
              onChange={(e) => setLoginVerifyCode(e.target.value)}
              value={loginVerifyCode}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <div className={styles.hugeBtn} onClick={() => getVerifyCode()}>
              <svg
                ref={(ref) =>
                  generateRoughSvg(ref, 'hugeBtn', {
                    fill: 'black',
                    fillStyle: 'solid',
                  })
                }
              />
              <span>验证码</span>
            </div>
            <div className={styles.hugeBtn} onClick={() => login()}>
              <svg
                ref={(ref) =>
                  generateRoughSvg(ref, 'hugeBtn', {
                    fill: 'black',
                    fillStyle: 'solid',
                  })
                }
              />
              <span>登录</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
