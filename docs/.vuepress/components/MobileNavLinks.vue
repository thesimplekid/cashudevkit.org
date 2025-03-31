<template>
  <div class="mobile-nav-links">
    <div
      v-for="item in navItems"
      :key="item.link || item.text"
      class="nav-item"
    >
      <NavLink
        v-if="item.link"
        :item="item"
      />
      <div
        v-else
        class="dropdown-wrapper"
      >
        <button
          class="dropdown-title"
          @click="toggleDropdown(item)"
        >
          {{ item.text }}
          <span class="arrow" :class="{ down: item.open }"></span>
        </button>

        <ul
          v-if="item.open"
          class="dropdown-items"
        >
          <li
            v-for="subItem in item.items"
            :key="subItem.link"
            class="dropdown-item"
          >
            <NavLink :item="subItem" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import NavLink from '@theme/components/NavLink.vue'

export default {
  name: 'MobileNavLinks',
  components: {
    NavLink
  },
  data() {
    return {
      navItems: []
    }
  },
  created() {
    this.navItems = this.getNavItems()
  },
  methods: {
    getNavItems() {
      const { nav } = this.$site.themeConfig
      return (nav || []).map(item => {
        return {
          ...item,
          open: false,
          items: item.items || []
        }
      })
    },
    toggleDropdown(item) {
      // Toggle the open state of the clicked dropdown
      item.open = !item.open
      
      // Close all other dropdowns
      this.navItems.forEach(navItem => {
        if (navItem !== item) {
          navItem.open = false
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.mobile-nav-links
  display: none
  
  @media (max-width: $MQMobile)
    display: block
    padding: 0 1.5rem
    
    .nav-item
      margin-bottom: 1rem
      
      a
        display: block
        color: var(--docs-header-link)
        padding: 0.5rem 0
        font-size: 1.1rem
        
        &:hover, &.router-link-exact-active
          color: var(--docs-header-link-accent)
    
    .dropdown-wrapper
      .dropdown-title
        display: block
        width: 100%
        text-align: left
        padding: 0.5rem 0
        background: transparent
        border: none
        color: var(--docs-header-link)
        font-size: 1.1rem
        cursor: pointer
        
        .arrow
          display: inline-block
          margin-left: 0.5rem
          border: solid var(--docs-header-link)
          border-width: 0 2px 2px 0
          padding: 3px
          transform: rotate(45deg)
          transition: transform 0.3s
          
          &.down
            transform: rotate(-135deg)
      
      .dropdown-items
        list-style: none
        padding: 0
        padding-left: 1rem
        margin: 0.5rem 0 1rem
        
        .dropdown-item
          margin: 0.5rem 0
</style>