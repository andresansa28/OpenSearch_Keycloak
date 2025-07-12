import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LayoutService } from "./service/app.layout.service";


@Component({
    selector: 'app-layout',
    templateUrl: './app.layout.component.html'
})
export class AppLayoutComponent implements OnDestroy {

    profileMenuOutsideClickListener: any;

    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router
    ) {
        // Listener per click esterno al menu profilo
        this.profileMenuOutsideClickListener = this.renderer.listen('document', 'click', event => {
            const topbarMenu = document.querySelector('.layout-topbar-menu');
            const triggerButton = document.querySelector('.layout-topbar-menu-button');
            if (
                topbarMenu && triggerButton &&
                !topbarMenu.contains(event.target as Node) &&
                !triggerButton.contains(event.target as Node)
            ) {
                this.hideProfileMenu();
            }
        });

        // Chiudi menu profilo al cambio pagina
        this.router.events.pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                this.hideProfileMenu();
            });
    }

    hideProfileMenu() {
        this.layoutService.state.profileSidebarVisible = false;
    }


    ngOnDestroy() {
        if (this.profileMenuOutsideClickListener) {
            this.profileMenuOutsideClickListener();
        }
    }
}
