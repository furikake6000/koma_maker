<template lang="pug">
  #help.d-flex
    v-navigation-drawer
      v-list(dense)
        v-subheader ヘルプ
        v-list-item-group(
          v-model="selectedArticleIndex"
          mandatory
        )
          v-list-item(
            v-for="article in articles"
            :key="article.id"
          )
            v-list-item-content
              v-list-item-title.body-2(v-text="article.title")
    v-container.mx-auto
      .cms-content(v-html="sanitizedContent")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import axios from 'axios';
import sanitizeHtml from 'sanitize-html';

class Article {
  id: string = '';
  title: string = '';
  content: string = '';

  constructor(id: string, title: string, content: string) {
    this.id = id;
    this.title = title;
    this.content = content;
  }
}

@Component
export default class Help extends Vue{
  private articles: Array<Article> = [];
  private selectedArticleIndex: number = 0;

  async mounted() {
    const response = await axios.get(
      'https://koma-maker.microcms.io/api/v1/help',
      {
        headers: { 'X-API-KEY' : process.env.VUE_APP_X_API_KEY }
      }
    );

    this.articles = response.data.contents;
  }

  // ---- Computed ----
  get selectedContent(): string {
    return this.articles[this.selectedArticleIndex]?.content || '';
  }

  get sanitizedContent(): string {
     return sanitizeHtml(
       this.selectedContent,
       {
         allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']) // imgタグはサニタイズ対象から除く
       }
     );
  }
}
</script>

<style lang="sass" scoped>
  #help
    height: 100%
</style>

<style lang="sass">
  .cms-content
    img
      max-width: 100%
</style>
