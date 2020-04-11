import route from './client/route'
import bootstrap from './client/bootstrap'

export default {
  route,
  routes: [
    {
      tagname: 'product-list',
      page: 'products'
    },
    {
      tagname: 'product-option-list',
      page: 'product_option_list'
    },
    {
      tagname: 'product-set-list',
      page: 'product_set_list'
    }
  ],
  bootstrap
}
