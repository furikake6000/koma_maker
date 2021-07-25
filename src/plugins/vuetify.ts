import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import colors from 'vuetify/lib/util/colors';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: colors.grey.darken3,
        secondary: colors.blueGrey.lighten3,
        accent: colors.yellow.base,
      },
    },
  },
});
