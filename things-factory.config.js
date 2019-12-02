import route from './client/route'
import bootstrap from './client/bootstrap'

export default {
  route,
  routes: [
    {
      tagname: 'product-list',
      page: 'products'
    }
  ],
  bootstrap
}
