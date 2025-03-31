<template>
  <aside class="sidebar">
    <!-- Add mobile navigation links at the top of sidebar -->
    <MobileNavLinks />
    
    <!-- Standard sidebar items -->
    <NavLinks />
    <slot name="top" />
    <SidebarLinks
      :depth="0"
      :items="items"
    />
    <slot name="bottom" />
  </aside>
</template>

<script>
import SidebarLinks from '@theme/components/SidebarLinks.vue'
import NavLinks from '@theme/components/NavLinks.vue'
import MobileNavLinks from './MobileNavLinks.vue'

export default {
  name: 'Sidebar',
  components: { SidebarLinks, NavLinks, MobileNavLinks },
  props: ['items']
}
</script>

<style lang="stylus">
.sidebar
  ul
    padding 0
    margin 0
    list-style-type none
  a
    display inline-block
  .nav-links
    display none
    border-bottom 1px solid var(--docs-border-color)
    padding 0.5rem 0 0.75rem 1.5rem
    
    a
      font-weight 600
    
  & > .sidebar-links
    padding 1.5rem 0
    & > li > a.sidebar-link
      font-size 1.1em
      line-height 1.7
      font-weight bold
    & > li:not(:first-child)
      margin-top .75rem

  @media (max-width: $MQMobile)
    .nav-links
      display block
      .dropdown-wrapper .nav-dropdown .dropdown-item a.router-link-active::after
        top calc(1rem - 2px)
    .sidebar-links
      padding 1rem 0
</style>