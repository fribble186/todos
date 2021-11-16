import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
    { path: '/diary', component: '@/pages/diary/index' },
  ],
  fastRefresh: {},
  theme: {
    'primary-color': '#E9D1AA',
  },
  chainWebpack(memo) {
    memo.resolve.alias.set(
      'roughjs',
      '/node_modules/roughjs/bundled/rough.cjs',
    );
    memo.module
      .rule('fonts')
      .test(/\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/)
      .use('file-loader?name=./fonts/[name].[ext]')
      .loader('file-loader?name=./fonts/[name].[ext]');
  },
});
