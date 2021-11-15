import React, { useState } from 'react';
import styles from './index.less';
import { Input, Button } from 'antd';
import { createFromIconfontCN } from '@ant-design/icons';
import rough from 'roughjs';

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_2938743_0z60qaj2omg.js',
});

interface ITodoItem {
  content: string;
  endTime: string;
  doneTime?: string;
}

const todos: ITodoItem[] = [
  {
    content: 'test1',
    endTime: '2021-11-15',
  },
  {
    content: 'test2',
    endTime: '2021-11-15',
  },
  {
    content: 'test3',
    endTime: '2021-11-15',
  },
];

export default function IndexPage() {
  const [] = useState();
  const drawRect = (ref: SVGSVGElement) => {
    const rc = rough.svg(ref);
    const node = rc.rectangle(2, 2, 35, 35);
    ref.appendChild(node);
  };
  const drawTitleBack = (ref: SVGSVGElement) => {
    const rc = rough.svg(ref);
    const node = rc.path(
      'M 16 64 C -3.2 112 64 102.4 54.4 150.4 C 73.6 92.8 188.8 169.6 188.8 73.6 C 150.4 92.8 179.2 25.6 92.8 16 C 92.8 -3.2 6.4 25.6 16 64',
      { fill: 'black', fillStyle: 'solid' },
    );
    ref.appendChild(node);
  };
  const drawAddInput = (ref: SVGSVGElement) => {
    const rc = rough.svg(ref);
    const node = rc.rectangle(2, 2, 500, 35);
    ref.appendChild(node);
  };
  const drawInputLine = (ref: SVGSVGElement) => {
    const rc = rough.svg(ref);
    const node = rc.line(0, 30, 500, 30);
    ref.appendChild(node);
  };
  const drawInputCircle = (ref: SVGSVGElement) => {
    const rc = rough.svg(ref);
    const node = rc.circle(20, 20, 20);
    ref.appendChild(node);
  };

  return (
    <div>
      <div className={styles.pcHeadContainer}>
        <div className={styles.durationSelector}>
          <div className={styles.durationSelectorItem}>
            <svg ref={drawRect} />
            <span>天</span>
          </div>
          <div className={styles.durationSelectorItem}>
            <svg ref={drawRect} />
            <span>周</span>
          </div>
          <div className={styles.durationSelectorItem}>
            <svg ref={drawRect} />
            <span>月</span>
          </div>
          <div className={styles.durationSelectorItem}>
            <svg ref={drawRect} />
            <span>年</span>
          </div>
        </div>
        {/* <div className={styles.userIcon}>
          <svg ref={drawTitleBack} id="back" />
          <div>无聊的日记本</div>
        </div> */}
      </div>
      <div />

      <div className={styles.todoAddContainer}>
        <div className={styles.diary}>
          <IconFont type="icon-riji" />
          <span>查看日记</span>
        </div>
        <div className={styles.svgContainer}>
          <svg ref={drawAddInput} />
          <Input bordered={false} />
        </div>
        <IconFont type="icon-qianbi" className={styles.todoAddBtn} />
        {/* <Button>
          <span>记一笔</span>
          <IconFont type="icon-qianbi" />
        </Button> */}
      </div>

      {todos.map((todo, todoIndex) => (
        <div key={`todo${todoIndex}`} className={styles.todoItemContainer}>
          <svg ref={drawInputCircle} className={styles.unselected} />
          {/* <IconFont type="icon-xuanzhong" className={styles.selected}/> */}
          <div className={styles.svgContainer}>
            <svg ref={drawInputLine} />
            <Input bordered={false} />
          </div>
          <div className={styles.icon}>
            <IconFont type="icon-bianji" />
          </div>
          <div className={styles.icon}>
            <IconFont type="icon-shanchu" />
          </div>
        </div>
      ))}
    </div>
  );
}
