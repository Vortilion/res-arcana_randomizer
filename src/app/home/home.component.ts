import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { StorageMap } from '@ngx-pwa/local-storage';
import { PlaceOfPowerSide } from '../models/place-of-power-side.model';
import { PlayerCountOption } from '../models/player-count-option.model';
import { ApplicationConfigService } from '../shared/application-config.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
    title = 'Res Arcana - Setup Randomizer';
    useLuxEtTenebrae!: boolean;
    usePerlaeImperii!: boolean;
    monumentCount!: number;
    playerCount!: number;
    placesCount!: number;
    mobileQuery!: MediaQueryList;
    playerCountList!: PlayerCountOption[];
    randomPlacesOfPower!: PlaceOfPowerSide[];
    playerLabel!: string;

    private _mobileQueryListener: () => void;

    constructor(
        private applicationConfigService: ApplicationConfigService,
        changeDetectorRef: ChangeDetectorRef,
        media: MediaMatcher,
        private storage: StorageMap
    ) {
        this.mobileQuery = media.matchMedia('(max-width: 600px)');
        this._mobileQueryListener = () => changeDetectorRef.detectChanges();
        this.mobileQuery.addEventListener('change', this._mobileQueryListener);
    }

    ngOnInit(): void {
        this.storage.get('rar-playerCount').subscribe((playerCount) => {
            (playerCount && typeof playerCount === 'number') ? this.emitPlayerCount(playerCount) : this.storage.set('rar-playerCount', 2).subscribe(() => {});
        });

        this.storage.get('rar-useLuxEtTenebrae').subscribe((useLuxEtTenebrae) => {
            (useLuxEtTenebrae !== undefined && typeof useLuxEtTenebrae === 'boolean') ? 
                this.applicationConfigService.useLuxEtTenebrae.emit(useLuxEtTenebrae) : this.storage.set('rar-useLuxEtTenebrae', false).subscribe(() => {});
        });

        this.storage.get('rar-usePerlaeImperii').subscribe((usePerlaeImperii) => {
            (usePerlaeImperii !== undefined && typeof usePerlaeImperii === 'boolean') ? 
                this.applicationConfigService.usePerlaeImperii.emit(usePerlaeImperii) : this.storage.set('rar-usePerlaeImperii', false).subscribe(() => {});
        });
        
        this.useLuxEtTenebrae = false;
        this.usePerlaeImperii = false;
        this.monumentCount = 10;
        this.placesCount = 5;
        this.playerCount = 2;

        this.playerCountList = [
            {
                label: '2',
                value: 2,
            }, {
                label: '3',
                value: 3,
            }, {
                label: '4',
                value: 4,
            },
        ];

        this.applicationConfigService.useLuxEtTenebrae.subscribe(
            (useLuxEtTenebrae: boolean) => {
                this.useLuxEtTenebrae = useLuxEtTenebrae;

                this.updatePlayerCountSelectionAndSetCounts();
            }
        );

        this.applicationConfigService.usePerlaeImperii.subscribe(
            (usePerlaeImperii: boolean) => {
                this.usePerlaeImperii = usePerlaeImperii;

                this.updatePlayerCountSelectionAndSetCounts();
            }
        );

        this.applicationConfigService.playerCount.subscribe(
            (playerCount: number) => {
                this.playerCount = playerCount;
            }
        );

        this.applicationConfigService.monumentCount.subscribe(
            (monumentCount: number) => {
                this.monumentCount = monumentCount;
            }
        );

        this.applicationConfigService.placesCount.subscribe(
            (placesCount: number) => {
                this.placesCount = placesCount;
            }
        );
    }

    updatePlayerCountSelectionAndSetCounts() {
        this.randomPlacesOfPower = [];
        let isExpansionSelected: boolean = this.useLuxEtTenebrae || this.usePerlaeImperii;
        this.updatePlayerCountSelection(isExpansionSelected);

        this.setPlacesCountAndMonumentCountForPlayerCountAndExpansionsSelected(
            this.playerCount,
            isExpansionSelected
        );
    }

    ngOnDestroy(): void {
        this.mobileQuery.removeEventListener(
            'change',
            this._mobileQueryListener
        );
    }

    onExpansionChange(event: MatSlideToggleChange) {
        if (event.source.name === 'useLuxEtTenebrae') {
            this.storage.set('rar-useLuxEtTenebrae', event.checked).subscribe(() => {});
            this.applicationConfigService.useLuxEtTenebrae.emit(event.checked);
        } else if (event.source.name === 'usePerlaeImperii') {
            this.storage.set('rar-usePerlaeImperii', event.checked).subscribe(() => {});
            this.applicationConfigService.usePerlaeImperii.emit(event.checked);
        }
        
    }

    emitPlayerCount(playerCount: any) {
        this.applicationConfigService.playerCount.emit(playerCount);

        this.randomPlacesOfPower = [];
        this.setPlacesCountAndMonumentCountForPlayerCountAndExpansionsSelected(
            this.playerCount,
            this.useLuxEtTenebrae || this.usePerlaeImperii
        );
    }

    onPlayerCountChange(event: MatSelectChange) {
        this.storage.set('rar-playerCount', event.value).subscribe(() => {});
        this.emitPlayerCount(event.value);
    }
    
    getAndSetRandomPlacesOfPower() {
        this.randomPlacesOfPower =
            this.applicationConfigService.getRandomPlacesForExpansionAndNumber(
                this.useLuxEtTenebrae,
                this.usePerlaeImperii,
                this.placesCount
            );
    }

    private updatePlayerCountSelection(isExpansionSelected: boolean) {
        if (isExpansionSelected) {
          if (this.playerCountList.length < 4) {
              this.playerCountList.push({
                  label: '5',
                  value: 5,
              });
          }
        } else {
            if(this.playerCountList.length === 5) {
                this.playerCountList.pop();
            }
        }
    }

    private setMonumentCountForPlayerCountAndExpansionsSelected(
        playerCount: number,
        expansionSelected: boolean
    ) {
        if (expansionSelected) {
            if (playerCount === 2) {
                this.applicationConfigService.monumentCount.emit(7);
            } else if (playerCount === 3) {
                this.applicationConfigService.monumentCount.emit(10);
            } else if (playerCount === 4) {
                this.applicationConfigService.monumentCount.emit(12);
            } else if (playerCount === 5) {
                this.applicationConfigService.monumentCount.emit(14);
            }
        } else {
            this.applicationConfigService.monumentCount.emit(10);
        }
    }

    private setPlacesOfPowerCountForPlayerCountAndExpansionsSelected(
        playerCount: number,
        isExpansionSelected: boolean
    ) {
        if (isExpansionSelected) {
            if (playerCount === 2) {
                this.applicationConfigService.placesCount.emit(4);
            } else if (playerCount === 3) {
                this.applicationConfigService.placesCount.emit(5);
            } else if (playerCount === 4) {
                this.applicationConfigService.placesCount.emit(6);
            } else if (playerCount === 5) {
                this.applicationConfigService.placesCount.emit(7);
            }
        } else {
            this.applicationConfigService.placesCount.emit(5);
        }
    }

    private setPlacesCountAndMonumentCountForPlayerCountAndExpansionsSelected(playerCount: number, isExpansionSelected: boolean) {
        this.setPlacesOfPowerCountForPlayerCountAndExpansionsSelected(
            playerCount,
            isExpansionSelected
        );
        this.setMonumentCountForPlayerCountAndExpansionsSelected(
            playerCount,
            isExpansionSelected
        );
    }
}
