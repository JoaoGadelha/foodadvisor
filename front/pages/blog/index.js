import delve from 'dlv';

import { useState } from 'react';
import { useQuery } from 'react-query';

import { getLocalizedParams } from '../../utils/localize';
import { getStrapiURL, getArticles } from '../../utils';

import Layout from '../../components/layout';
import Header from '../../components/shared/Header';
import Container from '../../components/shared/Container';
import BlockManager from '../../components/shared/BlockManager';
import ArticleCard from '../../components/pages/blog/ArticleCard';

const Articles = ({ global, initialData, pageData, categories, locale }) => {
  const [categoryId, setCategoryId] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const blocks = delve(pageData, 'blocks');
  const header = delve(pageData, 'header');
  const categoryText = delve(pageData, 'categoryText');

  const { data, status } = useQuery(
    ['articles', { category: categoryId }, { page: pageNumber }],
    getArticles,
    {
      initialData,
    }
  );

  return (
    <Layout global={global} pageData={pageData} type="blog-page">
      <Container>
        <Header {...header} />
        <div className="flex flex-col md:flex-row gap-2 my-24 px-4">
          <div>
            <label className="text-gray-700">
              <select
                className="block w-52 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                onChange={(value) => setCategoryId(value.target.value)}
              >
                <option value="">
                  {categoryId
                    ? 'Clear filter'
                    : categoryText || 'Select a category'}
                </option>
                {categories &&
                  categories.map((category, index) => (
                    <option key={`categoryOption-${index}`} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-4 mt-24 px-4">
          {status === 'loading' && <div>Loading articles</div>}
          {status === 'error' && <div>Oops</div>}
          {status === 'success' &&
            delve(data, 'articles') &&
            data.articles.map((article, index) => (
              <ArticleCard {...article} locale={locale} key={index} />
            ))}
        </div>

        {data.count > 0 && (
          <div className="grid grid-cols-3 gap-4 my-24">
            <div className="col-start-2 col-end-3">
              <div className="flex items-center">
                <button
                  type="button"
                  className={`${
                    pageNumber <= 1 ? 'cursor-not-allowed opacity-50' : ''
                  } w-full p-4 border text-base rounded-l-xl text-gray-600 bg-white hover:bg-gray-100 focus:outline-none`}
                  onClick={() => setPageNumber(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                >
                  Previous
                </button>

                <button
                  type="button"
                  className={`${
                    pageNumber >= data.count
                      ? 'cursor-not-allowed opacity-50'
                      : ''
                  } w-full p-4 border-t border-b border-r text-base rounded-r-xl text-gray-600 bg-white hover:bg-gray-100 focus:outline-none`}
                  onClick={() => setPageNumber(pageNumber + 1)}
                  disabled={pageNumber >= data.count}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
      <BlockManager blocks={blocks} />
    </Layout>
  );
};

// This gets called on every request
export async function getServerSideProps(context) {
  const { locale } = getLocalizedParams(context.query);

  const resBlogPage = await fetch(getStrapiURL(`/blog-page?_locale=${locale}`));
  const blogPage = await resBlogPage.json();

  const resArticles = await fetch(getStrapiURL(`/articles?_limit=12`));
  const restaurants = await resArticles.json();

  const resCountArticles = await fetch(getStrapiURL(`/articles/count`));
  const countArticles = await resCountArticles.json();

  const resCategories = await fetch(getStrapiURL(`/categories`));
  const categories = await resCategories.json();

  const resLocales = await fetch(getStrapiURL(`/i18n/locales`));
  const locales = await resLocales.json();

  if (!restaurants.length || !categories.length || !locales.length) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      initialData: { restaurants, count: countArticles },
      pageData: blogPage,
      categories,
      locale,
    },
  };
}

export default Articles;
