import { TestBed, inject } from "@angular/core/testing";
import { OpenWalletService } from "./openwallet.service";

describe("OpenWalletService", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [OpenWalletService]
        });
    });

    it("should ...", inject(
        [OpenWalletService],
        (service: OpenWalletService) => {
            expect(service).toBeTruthy();
        }
    ));
});
