<template lang="pug">
  #help.d-flex
    v-navigation-drawer
      v-list(shaped)
        v-subheader ヘルプ
        v-list-item-group(
          v-model="selectedArticleIndex"
        )
          v-list-item(
            v-for="article in articles"
            :key="article.id"
          )
            v-list-item-content
              v-list-item-title(v-text="article.title")
    div(v-html="sanitizedContent")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
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

  mounted() {
    this.articles = [
      new Article(
        'test',
        'test title',
        'test article'
      ),
      new Article(
        'test2',
        'test2 title',
        'test2 article'
      ),
    ];
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
