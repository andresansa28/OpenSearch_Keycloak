import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { NgxPermissionsModule, NgxPermissionsRestrictStubDirective } from "ngx-permissions";
import { AnalyzerStatusService } from 'src/app/services/analyzer-status.service';
import { MaterialModule } from '../material-module';
import { AppLayoutComponent } from "./app.layout.component";
import { AppTopBarComponent } from './app.topbar.component';

@NgModule({
    declarations: [
        AppTopBarComponent,
        AppLayoutComponent
    ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MaterialModule,
    RouterModule,
    NgxPermissionsModule,
    NgxPermissionsRestrictStubDirective
  ],
    providers: [
        AnalyzerStatusService
    ],
    exports: [AppLayoutComponent]
})
export class AppLayoutModule { }
