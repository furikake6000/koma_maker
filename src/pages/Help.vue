<template lang="pug">
  v-navigation-drawer
    v-list(shaped)
      v-subheader ヘルプ
      v-list-item-group(
        v-model="selectedArticle"
      )
        v-list-item(
          v-for="article in articles"
          :key="article.id"
        )
          v-list-item-content
            v-list-item-title(v-text="article.title")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

class Article {
  id: string = '';
  title: string = '';
  article: string = '';

  constructor(id: string, title: string, article: string) {
    this.id = id;
    this.title = title;
    this.article = article;
  }
}

@Component
export default class Help extends Vue{
  private articles: Array<Article> = [];
  private selectedArticle: number = 0;

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
}
</script>

<style lang="sass" scoped>

</style>
