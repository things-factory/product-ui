import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openImportPopUp } from '@things-factory/import-ui'
import { client, CustomAlert, PageView } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class ProductList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      searchFields: Array,
      config: Object
    }
  }

  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        search-form {
          overflow: visible;
        }
        data-grist {
          overflow-y: auto;
          flex: 1;
        }
      `
    ]
  }

  render() {
    return html`
      <search-form .fields=${this.searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .data=${this.data}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.product'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: () => this._saveProducts(this.dataGrist.exportPatchList({ flagName: 'cuFlag ' }))
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteProducts.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.product'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: records => {
          const config = {
            rows: this.config.rows,
            columns: [...this.config.columns.filter(column => column.imex !== undefined)]
          }
          openImportPopUp(records, config, async patches => {
            await this._saveProducts(patches)
            history.back()
          })
        }
      }
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async pageInitialized() {
    const productType = await getCodeByName('PRODUCT_TYPES')
    const packingType = await getCodeByName('PACKING_TYPES')

    this.searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        props: {
          searchOper: 'i_like'
        }
      },
      {
        label: i18next.t('field.product_ref'),
        name: 'productRef',
        type: 'object',
        queryName: 'products',
        field: 'name'
      },
      {
        label: i18next.t('field.type'),
        name: 'type',
        props: {
          searchOper: 'i_like'
        }
      }
    ]

    this.config = {
      rows: {
        handlers: { click: this._setProductRefCondition.bind(this) },
        selectable: { multiple: true }
      },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'sku',
          record: { editable: true },
          imex: { header: 'sku', key: 'sku', width: 50, type: 'string' },
          header: i18next.t('field.sku'),
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'name',
          record: { editable: true },
          imex: { header: 'Name', key: 'name', width: 50, type: 'string' },
          header: i18next.t('field.name'),
          sortable: true,
          width: 180
        },
        {
          type: 'object',
          name: 'productRef',
          record: {
            editable: true,
            options: {
              queryName: 'products',
              select: [
                { name: 'id', hidden: true },
                { name: 'sku', header: i18next.t('field.sku'), width: 200 },
                { name: 'name', header: i18next.t('field.name'), width: 200 },
                { name: 'description', header: i18next.t('field.description'), width: 500 }
              ]
            }
          },
          imex: { header: 'Product Ref', key: 'productRef', width: 50, type: 'string' },
          header: i18next.t('field.product_ref'),
          sortable: true,
          width: 230
        },
        {
          type: 'object',
          name: 'childProductRef',
          record: {
            editable: true,
            options: {
              queryName: 'products',
              select: [
                { name: 'id', hidden: true },
                { name: 'sku', header: i18next.t('field.sku'), width: 200 },
                { name: 'name', header: i18next.t('field.name'), width: 200 },
                { name: 'description', header: i18next.t('field.description'), width: 300 },
                { name: 'packingType', header: i18next.t('field.packingType'), width: 150 }
              ]
            }
          },
          imex: { header: 'Child Product Ref', key: 'childProductRef', width: 50, type: 'string' },
          header: i18next.t('field.child_product_ref'),
          sortable: true,
          width: 230
        },
        {
          type: 'float',
          name: 'childProductQty',
          record: { editable: true, align: 'center' },
          imex: { header: 'Child Product Qty', key: 'childProductQty', width: 50, type: 'float' },
          header: i18next.t('field.child_product_qty'),
          width: 80
        },
        {
          type: 'string',
          name: 'description',
          record: { editable: true },
          imex: { header: 'Description', key: 'description', width: 50, type: 'string' },
          header: i18next.t('field.description'),
          sortable: true,
          width: 300
        },
        {
          type: 'select',
          name: 'type',
          header: i18next.t('field.type'),
          record: {
            editable: true,
            align: 'center',
            options: ['', ...Object.keys(productType).map(key => productType[key].name)]
          },
          imex: {
            header: i18next.t('field.type'),
            key: 'type',
            width: 50,
            type: 'array',
            arrData: productType.map(productType => {
              return {
                name: productType.name,
                id: productType.name
              }
            })
          },
          sortable: true,
          width: 120
        },
        {
          type: 'select',
          name: 'packingType',
          header: i18next.t('field.packingType'),
          record: {
            editable: true,
            align: 'center',
            options: ['', ...Object.keys(packingType).map(key => packingType[key].name)]
          },
          imex: {
            header: i18next.t('field.packingType'),
            key: 'packingType',
            width: 50,
            type: 'array',
            arrData: packingType.map(packingType => {
              return {
                name: packingType.name,
                id: packingType.name
              }
            })
          },
          width: 120
        },
        {
          type: 'integer',
          name: 'expirationPeriod',
          record: { align: 'center', editable: true },
          imex: { header: 'Expiration Period', key: 'expirationPeriod', width: 50, type: 'integer' },
          header: i18next.t('field.expiration_period'),
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'weightUnit',
          record: { editable: true, align: 'center' },
          imex: { header: 'Weight Unit', key: 'weightUnit', width: 50, type: 'string' },
          header: i18next.t('field.weight_unit'),
          width: 80
        },
        {
          type: 'float',
          name: 'weight',
          record: { editable: true, align: 'center' },
          imex: { header: 'Weight', key: 'weight', width: 50, type: 'float' },
          header: i18next.t('field.weight'),
          width: 80
        },
        {
          type: 'float',
          name: 'density',
          record: { editable: true, align: 'center' },
          imex: { header: 'Density', key: 'density', width: 50, type: 'float' },
          header: i18next.t('field.density'),
          width: 80
        },
        {
          type: 'string',
          name: 'lengthUnit',
          record: { editable: true, align: 'center' },
          imex: { header: 'Length Unit', key: 'lengthUnit', width: 50, type: 'string' },
          header: i18next.t('field.length_unit'),
          width: 80
        },
        {
          type: 'float',
          name: 'width',
          record: { editable: true, align: 'center' },
          imex: { header: 'Width', key: 'width', width: 50, type: 'float' },
          header: i18next.t('field.width'),
          width: 80
        },
        {
          type: 'float',
          name: 'depth',
          record: { editable: true, align: 'center' },
          imex: { header: 'Depth', key: 'depth', width: 50, type: 'float' },
          header: i18next.t('field.depth'),
          width: 80
        },
        {
          type: 'float',
          name: 'height',
          record: { editable: true, align: 'center' },
          imex: { header: 'Height', key: 'height', width: 50, type: 'float' },
          header: i18next.t('field.height'),
          width: 80
        },
        {
          type: 'string',
          name: 'auxUnit1',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Unit 1', key: 'auxUnit1', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_unit')} 1`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxValue1',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Value 1', key: 'auxValue1', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_value')} 1`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxUnit2',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Unit 2', key: 'auxUnit2', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_unit')} 2`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxValue2',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Value 2', key: 'auxValue2', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_value')} 2`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxUnit3',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Unit 3', key: 'auxUnit3', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_unit')} 3`,
          width: 80
        },
        {
          type: 'string',
          name: 'auxValue3',
          record: { editable: true, align: 'center' },
          imex: { header: 'Aux Value 3', key: 'auxValue3', width: 50, type: 'string' },
          header: `${i18next.t('field.aux_value')} 3`,
          width: 80
        },
        {
          type: 'object',
          name: 'updater',
          record: { align: 'center', editable: false },
          header: i18next.t('field.updater'),
          width: 250
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          record: { align: 'center', editable: false },
          header: i18next.t('field.updated_at'),
          sortable: true,
          width: 180
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async fetchHandler({ page, limit, sorters = [{ name: 'name' }] }) {
    const response = await client.query({
      query: gql`
        query {
          products(${gqlBuilder.buildArgs({
            filters: await this.searchForm.getQueryFilters(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              sku
              id
              name
              description
              productRef {
                name
                description
              }
              childProductRef{
                name
                description
              }
              childProductQty
              packingType
              type
              expirationPeriod
              weightUnit
              weight
              density
              lengthUnit
              width
              depth
              height
              auxUnit1
              auxValue1
              auxUnit2
              auxValue2
              auxUnit3
              auxValue3
              updater {
                name
                description
              }
              updatedAt
            }
            total
          }
        }
        `
    })

    if (!response.errors) {
      return {
        total: response.data.products.total || 0,
        records: response.data.products.items || []
      }
    }
  }

  _setProductRefCondition(_columns, _data, _column, record, _rowIndex) {
    this.config.columns.map(column => {
      if (column.name === 'productRef' || column.name === 'childProductRef') {
        if (record && record.id) {
          column.record.options.basicArgs = { filters: [{ name: 'id', operator: 'noteq', value: record.id }] }
        } else {
          delete column.record.options.basicArgs
        }
      }
    })
  }

  async _saveProducts(patches) {
    if (patches && patches.length) {
      patches = patches.map(patch => {
        patch.weight = parseFloat(patch.weight)
        patch.density = parseFloat(patch.density)
        patch.width = parseFloat(patch.width)
        patch.depth = parseFloat(patch.depth)
        patch.height = parseFloat(patch.height)
        patch.expirationPeriod = parseFloat(patch.expirationPeriod)
        patch.childProductQty = parseFloat(patch.childProductQty)

        if (patch.childProductRef) {
          delete patch.childProductRef.sku
          delete patch.childProductRef.packingType
        }

        if (patch.productRef) {
          delete patch.productRef.sku
        }

        return patch
      })

      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleProduct(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        this.showToast(i18next.t('text.data_updated_successfully'))
      }
    } else {
      CustomAlert({
        title: i18next.t('text.nothing_changed'),
        text: i18next.t('text.there_is_nothing_to_save')
      })
    }
  }

  async _deleteProducts() {
    const ids = this.dataGrist.selected.map(record => record.id)
    if (ids && ids.length) {
      const anwer = await CustomAlert({
        type: 'warning',
        title: i18next.t('button.delete'),
        text: i18next.t('text.are_you_sure'),
        confirmButton: { text: i18next.t('button.delete') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!anwer.value) return

      const response = await client.query({
        query: gql`
          mutation {
            deleteProducts(${gqlBuilder.buildArgs({ ids })})
          }
        `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        this.showToast(i18next.t('text.data_deleted_successfully'))
      }
    } else {
      CustomAlert({
        title: i18next.t('text.nothing_selected'),
        text: i18next.t('text.there_is_nothing_to_delete')
      })
    }
  }

  _exportableData() {
    let records = []
    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      records = this.dataGrist.selected
    } else {
      records = this.dataGrist.data.records
    }

    var headerSetting = this.dataGrist._config.columns
      .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
      .map(column => {
        return column.imex
      })

    var data = records.map(item => {
      return {
        id: item.id,
        ...this.config.columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .reduce((record, column) => {
            record[column.imex.key] = column.imex.key
              .split('.')
              .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
            return record
          }, {})
      }
    })

    return { header: headerSetting, data: data }
  }

  showToast(message) {
    document.dispatchEvent(new CustomEvent('notify', { detail: { message } }))
  }
}

window.customElements.define('product-list', ProductList)
