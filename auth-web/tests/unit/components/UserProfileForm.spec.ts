import { Wrapper, createLocalVue, mount } from '@vue/test-utils'
import ModalDialog from '@/components/auth/ModalDialog.vue'
import TermsOfUseDialog from '@/components/auth/TermsOfUseDialog.vue'
import UserModule from '@/store/modules/user'
import UserProfileForm from '@/components/auth/UserProfileForm.vue'
import Vue from 'vue'
import VueRouter from 'vue-router'
import Vuetify from 'vuetify'
import Vuex from 'vuex'
import i18n from '../../../src/plugins/i18n'

Vue.use(Vuetify)
Vue.use(VueRouter)

describe('UserProfileForm.vue', () => {
  let wrapper: Wrapper<UserProfileForm>
  const config = {
    'VUE_APP_ROOT_API': 'https://localhost:8080/api/v1/11',
    'VUE_APP_COPS_REDIRECT_URL': 'https://coops-dev.pathfinder.gov.bc.ca/',
    'VUE_APP_PAY_ROOT_API': 'https://pay-api-dev.pathfinder.gov.bc.ca/api/v1'
  }

  sessionStorage.__STORE__['AUTH_API_CONFIG'] = JSON.stringify(config)
  beforeEach(() => {
    const localVue = createLocalVue()
    localVue.use(Vuex)
    const $t = () => 'test'

    const store = new Vuex.Store({
      strict: false,
      modules: {
        user: UserModule
      }
    })

    wrapper = mount(UserProfileForm, {
      store,
      localVue,
      mocks: { $t },
      stubs: {
        ModalDialog: true,
        TermsOfUseDialog: true
      }
    })

    jest.resetModules()
    jest.clearAllMocks()
  })

  it('is a Vue instance', () => {
    expect(wrapper.isVueInstance()).toBeTruthy()
  })

  it('user profile form has save and cancel buttons', () => {
    expect(wrapper.find('.save-continue-button')).toBeTruthy()
    expect(wrapper.find('.cancel-button')).toBeTruthy()
  })

  it('first name is empty', () => {
    expect(wrapper.vm.$data.firstName).toBe('')
  })

  it('last name is empty', () => {
    expect(wrapper.vm.$data.lastName).toBe('')
  })

  it('email data is empty', () => {
    expect(wrapper.vm.$data.emailAddress).toBe('')
  })

  it('confirm email data is empty', () => {
    expect(wrapper.vm.$data.confirmedEmailAddress).toBe('')
  })

  it('confirm phone data is empty', () => {
    expect(wrapper.vm.$data.phoneNumber).toBe('')
  })

  it('confirm extension data to be empty', () => {
    expect(wrapper.vm.$data.extension).toBe('')
  })
})