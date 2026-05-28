import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-12-01',
  useCdn: false,
  perspective: 'published',
});
console.log('Cairo city by _id:        ', await client.fetch(`*[_id=="wp-page-83284"][0]{_id, "name": name[_key=="en"][0].value}`));
console.log('Cairo city by slug:       ', await client.fetch(`*[_type=="city" && slug[_key=="en"][0].value.current=="cairo"][0]{_id, "name": name[_key=="en"][0].value}`));
console.log('Count cities:             ', await client.fetch(`count(*[_type=="city"])`));
console.log('Count guideArticles all:  ', await client.fetch(`count(*[_type=="guideArticle"])`));
console.log('Count GA with wp-page id: ', await client.fetch(`count(*[_type=="guideArticle" && _id match "wp-page-*"])`));
console.log('Count GA with new id:     ', await client.fetch(`count(*[_type=="guideArticle" && _id match "guideArticle.*"])`));
console.log('Sample wp-page GA:        ', await client.fetch(`*[_type=="guideArticle" && _id match "wp-page-*"][0]{_id, "title": title[_key=="en"][0].value}`));
console.log('Sample new-id GA:         ', await client.fetch(`*[_type=="guideArticle" && _id match "guideArticle.*"][0]{_id, "title": title[_key=="en"][0].value}`));
